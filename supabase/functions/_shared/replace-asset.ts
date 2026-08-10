/**
 * Regenerate means replace: once a fresh asset row is safely stored, every
 * earlier row occupying the same slot is deleted along with its storage object.
 * Never call this before the replacement is committed — the old image is the
 * only thing the founder has until the new one lands.
 */
export async function replaceSupersededAssets(opts: {
  admin: any;
  bucket: string;
  table: string;
  /** Column/value pairs identifying the slot (snapshot + platform + kind, etc). */
  match: Record<string, unknown>;
  /** The freshly inserted row that must survive. */
  keepId: string;
}): Promise<{ removed: number; wasSelected: boolean }> {
  const { admin, bucket, table, match, keepId } = opts;
  try {
    let q = admin.from(table).select("id, storage_path, is_selected");
    for (const [col, val] of Object.entries(match)) q = q.eq(col, val);
    const { data: rows, error } = await q.neq("id", keepId);
    if (error) throw error;
    const stale = (rows ?? []) as Array<{ id: string; storage_path: string | null; is_selected?: boolean }>;
    if (!stale.length) return { removed: 0, wasSelected: false };

    const paths = stale.map((r) => r.storage_path).filter(Boolean) as string[];
    if (paths.length) {
      const { error: rmErr } = await admin.storage.from(bucket).remove(paths);
      if (rmErr) console.warn(`replaceSupersededAssets: storage remove failed on ${table}`, rmErr.message);
    }
    const { error: delErr } = await admin
      .from(table)
      .delete()
      .in("id", stale.map((r) => r.id));
    if (delErr) console.warn(`replaceSupersededAssets: row delete failed on ${table}`, delErr.message);

    return { removed: stale.length, wasSelected: stale.some((r) => r.is_selected === true) };
  } catch (e) {
    // Cleanup must never break a successful generation.
    console.warn(`replaceSupersededAssets: skipped on ${table}`, (e as Error).message);
    return { removed: 0, wasSelected: false };
  }
}
