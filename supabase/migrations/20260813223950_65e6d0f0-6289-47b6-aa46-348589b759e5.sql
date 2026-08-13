update venture_brand_kits k
set logos = sub.new_logos
from (
  select k2.snapshot_id,
         jsonb_agg(
           case when l ? 'form' and l ? 'tone' then l
           else l
                || jsonb_build_object(
                     'form',
                     case coalesce(l->>'variant','primary')
                       when 'icon' then 'symbol'
                       when 'icon_reversed' then 'symbol'
                       when 'stacked' then 'stacked'
                       when 'stacked_reversed' then 'stacked'
                       when 'wordmark' then 'wordmark'
                       when 'wordmark_reversed' then 'wordmark'
                       else 'horizontal' end,
                     'tone',
                     case when coalesce(l->>'variant','primary') in ('reversed','stacked_reversed','icon_reversed','wordmark_reversed')
                          then 'inverse' else 'colour' end)
           end
           order by ord
         ) as new_logos
  from venture_brand_kits k2,
       lateral jsonb_array_elements(k2.logos) with ordinality as t(l, ord)
  where jsonb_typeof(k2.logos) = 'array'
    and jsonb_array_length(k2.logos) > 0
    and k2.logos::text like '%"source":"upload"%'
  group by k2.snapshot_id
) sub
where k.snapshot_id = sub.snapshot_id;