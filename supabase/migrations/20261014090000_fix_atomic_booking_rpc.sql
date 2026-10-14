-- Restore the RPC used by the public booking form.
-- Prices and availability are computed server-side; the client cannot choose a total.
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  _user_id uuid,
  _group_id text,
  _guest_name text,
  _guest_phone text,
  _guest_email text,
  _check_in date,
  _check_out date,
  _num_guests integer,
  _notes text,
  _room_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _booking_id uuid;
  _room_count integer;
  _total_price numeric(10,2);
BEGIN
  IF _guest_name IS NULL OR btrim(_guest_name) = '' THEN
    RAISE EXCEPTION 'Guest name is required';
  END IF;
  IF _guest_phone IS NULL OR btrim(_guest_phone) = '' THEN
    RAISE EXCEPTION 'Guest phone is required';
  END IF;
  IF _check_in IS NULL OR _check_out IS NULL OR _check_out <= _check_in THEN
    RAISE EXCEPTION 'Check-out must be after check-in';
  END IF;
  IF _check_in < CURRENT_DATE THEN
    RAISE EXCEPTION 'Check-in cannot be in the past';
  END IF;
  IF COALESCE(_num_guests, 0) < 1 OR _num_guests > 2 THEN
    RAISE EXCEPTION 'Number of guests must be between 1 and 2';
  END IF;
  IF _room_ids IS NULL OR cardinality(_room_ids) = 0 THEN
    RAISE EXCEPTION 'Please select a room';
  END IF;
  IF cardinality(_room_ids) <> (SELECT count(DISTINCT id) FROM unnest(_room_ids) AS ids(id)) THEN
    RAISE EXCEPTION 'Duplicate room selection';
  END IF;

  -- Do not let an anonymous caller assign a booking to another user.
  IF auth.uid() IS NULL THEN
    IF _user_id IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid booking user';
    END IF;
  ELSIF _user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Invalid booking user';
  END IF;

  -- Lock room rows in a stable order so concurrent requests for the same room
  -- serialize before the overlap check.
  PERFORM r.id
  FROM public.rooms AS r
  WHERE r.id = ANY(_room_ids) AND r.active = true
  ORDER BY r.id
  FOR UPDATE;

  SELECT count(*), COALESCE(sum(r.price_per_night), 0) * (_check_out - _check_in)
    INTO _room_count, _total_price
  FROM public.rooms AS r
  WHERE r.id = ANY(_room_ids) AND r.active = true;

  IF _room_count <> cardinality(_room_ids) THEN
    RAISE EXCEPTION 'One or more selected rooms are unavailable';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.booking_rooms AS br
    JOIN public.bookings AS b ON b.id = br.booking_id
    WHERE br.room_id = ANY(_room_ids)
      AND b.status <> 'cancelled'
      AND b.check_in < _check_out
      AND b.check_out > _check_in
  ) THEN
    RAISE EXCEPTION 'One or more selected rooms are no longer available for those dates';
  END IF;

  INSERT INTO public.bookings (
    user_id, group_id, guest_name, guest_phone, guest_email,
    check_in, check_out, num_guests, total_price, status, notes
  ) VALUES (
    _user_id,
    COALESCE(NULLIF(btrim(_group_id), ''), gen_random_uuid()::text),
    btrim(_guest_name),
    btrim(_guest_phone),
    NULLIF(btrim(COALESCE(_guest_email, '')), ''),
    _check_in,
    _check_out,
    _num_guests,
    _total_price,
    'pending',
    NULLIF(btrim(COALESCE(_notes, '')), '')
  )
  RETURNING id INTO _booking_id;

  INSERT INTO public.booking_rooms (booking_id, room_id)
  SELECT _booking_id, unnest(_room_ids);

  RETURN jsonb_build_object(
    'booking_id', _booking_id,
    'total_price', _total_price
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_atomic(uuid, text, text, text, date, date, integer, text, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(uuid, text, text, text, date, date, integer, text, uuid[]) TO anon, authenticated;
