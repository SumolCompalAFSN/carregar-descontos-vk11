export type ComboRow = {
  H4_code: string;
  H5_code: string;
  H6_code: string;
  H7_code: string;
  H4_label: string;
  H5_label: string;
  H6_label: string;
  H7_label: string;
};

export type MaterialRow = {
  material_code: string;
  material_label: string;
};

export type CatalogMetadata = {
  catalog_version: string;
  updated_at: string;
  source_file: string;
  sheets: {
    combos: string;
    materials: string;
  };
  counts: {
    combos: number;
    materials: number;
    distinct_h4: number;
  };
  checksums: {
    catalog_combos_sha256: string;
    catalog_materials_sha256: string;
  };
  distinct_h4: Array<{
    H4_code: string;
    H4_label: string;
  }>;
};

function url(path: string) {
  return `${import.meta.env.BASE_URL}${path}`.replace(/([^:]\/)\/+/g, '$1');
}

export async function loadCatalogMetadata(): Promise<CatalogMetadata> {
  const res = await fetch(url('catalog/catalog_metadata.json'), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Não foi possível carregar catalog_metadata.json');
  }
  return res.json();
}

export async function loadCatalogCombos(): Promise<ComboRow[]> {
  const res = await fetch(url('catalog/catalog_combos.json'), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Não foi possível carregar catalog_combos.json');
  }
  return res.json();
}

export async function loadCatalogMaterials(): Promise<MaterialRow[]> {
  const res = await fetch(url('catalog/catalog_materials.json'), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Não foi possível carregar catalog_materials.json');
  }
  return res.json();
}

export function getUniqueH4(combos: ComboRow[]) {
  const map = new Map<string, string>();

  for (const row of combos) {
    if (!map.has(row.H4_code)) {
      map.set(row.H4_code, row.H4_label);
    }
  }

  return Array.from(map.entries()).map(([H4_code, H4_label]) => ({
    H4_code,
    H4_label,
  }));
}
