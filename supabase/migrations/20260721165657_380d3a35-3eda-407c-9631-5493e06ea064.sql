UPDATE public.private_session_slots SET end_time = TIME '11:00' WHERE start_time = TIME '09:30' AND end_time <> TIME '11:00';
UPDATE public.private_session_slots SET end_time = TIME '12:40' WHERE start_time = TIME '11:10' AND end_time <> TIME '12:40';
UPDATE public.private_session_slots SET end_time = TIME '14:20' WHERE start_time = TIME '12:50' AND end_time <> TIME '14:20';
UPDATE public.private_session_slots SET end_time = TIME '16:00' WHERE start_time = TIME '14:30' AND end_time <> TIME '16:00';