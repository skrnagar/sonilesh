-- Trigger helper is SECURITY DEFINER and must not be callable by anonymous PostgREST.
revoke execute on function public.prevent_contractor_doc_self_verify() from anon, public;
