export interface Client {
  id: string;
  name: string;
  type: 'PAGADOR' | 'HQ';
  code: string;
}

export interface CatalogItem {
  id: string; // SKU code / material_code (e.g., '100401')
  name: string; // material_label
  brandCode: string;       // H4_code (e.g., '40')
  brandLabel: string;      // H4_label (e.g., 'Compal')
  subBrandCode: string;    // H5_code (e.g., '67')
  subBrandLabel: string;   // H5_label (e.g., 'Compal Clássico')
  packTypeCode: string;    // H6_code (e.g., '17')
  packTypeLabel: string;   // H6_label (e.g., 'Tara Perdida')
  capacityCode: string;    // H7_code (e.g., 'D3')
  capacityLabel: string;   // H7_label (e.g., '0.33L')
  priceUnit: string;  
}

export interface CatalogMetadata {
  version: string;
  source: string;
  updatedAt: string;
  checksum: string;
}

export const activeCatalogMetadata: CatalogMetadata = {
  version: "2026.05.28",
  source: "Catálogo_Ativo_SAP_VK11_v3.xlsx",
  updatedAt: "2026-05-28T16:44:25Z",
  checksum: "9d8e7c6b5a4f3e2d1c"
};

export const mockClients: Client[] = [
  { id: '1', name: 'Supermercados Continente S.A.', type: 'PAGADOR', code: '4100223' },
  { id: '2', name: 'Pingo Doce Distribuição Lda.', type: 'PAGADOR', code: '4100482' },
  { id: '3', name: 'Auchan Portugal Supermercados', type: 'PAGADOR', code: '4100910' },
  { id: '4', name: 'SONAE DISTRIBUIÇÃO SGPS (Grupo HQ)', type: 'HQ', code: '5100010' },
  { id: '5', name: 'JERÓNIMO MARTINS SGPS (Grupo HQ)', type: 'HQ', code: '5100015' },
  { id: '6', name: 'INTERMARCHÉ PORTUGAL', type: 'PAGADOR', code: '4101004' }
];

export const mockCatalog: CatalogItem[] = [
  // --- COMPAL (H4=10) ---
  { 
    id: '2000101', 
    name: 'Compal Clássico Pêssego Garrafa OW 0.20L', 
    brandCode: '10', brandLabel: 'Compal', 
    subBrandCode: 'E7', subBrandLabel: 'Compal Clássico', 
    packTypeCode: '17', packTypeLabel: 'Garrafa OW', 
    capacityCode: 'D2', capacityLabel: '0.20L', 
    priceUnit: 'Garrafa'
  },
  { 
    id: '2000102', 
    name: 'Compal Clássico Pera Rocha Pacote 1.0L', 
    brandCode: '10', brandLabel: 'Compal', 
    subBrandCode: 'E7', subBrandLabel: 'Compal Clássico', 
    packTypeCode: '24', packTypeLabel: 'Pacote Tetra', 
    capacityCode: 'D1', capacityLabel: '1.0L', 
    priceUnit: 'Pacote'
  },

  // --- UM BONGO (H4=11) ---
  {
    id: '2000111',
    name: 'Um Bongo 8 Frutos Pacote 0.20L',
    brandCode: '11', brandLabel: 'Um Bongo',
    subBrandCode: 'U1', subBrandLabel: 'Néctar Um Bongo',
    packTypeCode: '24', packTypeLabel: 'Pacote Tetra',
    capacityCode: 'D2', capacityLabel: '0.20L',
    priceUnit: 'Pacote'
  },
  
  // --- SUMOL (H4=13) ---
  { 
    id: '2000131', 
    name: 'Sumol Laranja Lata 0.33L', 
    brandCode: '13', brandLabel: 'Sumol', 
    subBrandCode: 'G1', subBrandLabel: 'Sumol Laranja', 
    packTypeCode: '12', packTypeLabel: 'Lata mítica', 
    capacityCode: 'D3', capacityLabel: '0.33L', 
    priceUnit: 'Lata'
  },
  { 
    id: '2000132', 
    name: 'Sumol Ananás Lata 0.33L', 
    brandCode: '13', brandLabel: 'Sumol', 
    subBrandCode: 'G2', subBrandLabel: 'Sumol Ananás', 
    packTypeCode: '12', packTypeLabel: 'Lata mítica', 
    capacityCode: 'D3', capacityLabel: '0.33L', 
    priceUnit: 'Lata'
  },

  // --- PEPSI (H4=14) ---
  { 
    id: '2000141', 
    name: 'Pepsi Regular Lata 0.33L', 
    brandCode: '14', brandLabel: 'Pepsi', 
    subBrandCode: 'G5', subBrandLabel: 'Pepsi Regular', 
    packTypeCode: '12', packTypeLabel: 'Lata mítica', 
    capacityCode: 'D3', capacityLabel: '0.33L', 
    priceUnit: 'Lata'
  },

  // --- LIPTON (H4=15) ---
  {
    id: '2000151',
    name: 'Lipton Ice Tea Pêssego Lata 0.33L',
    brandCode: '15', brandLabel: 'Lipton',
    subBrandCode: 'L1', subBrandLabel: 'Lipton Chá',
    packTypeCode: '12', packTypeLabel: 'Lata',
    capacityCode: 'D3', capacityLabel: '0.33L',
    priceUnit: 'Lata'
  },

  // --- FRIZE (H4=16) ---
  {
    id: '2000161',
    name: 'Frize Limão Gás Garrafa OW 0.25L',
    brandCode: '16', brandLabel: 'Frize',
    subBrandCode: 'FR', subBrandLabel: 'Frize Sabores',
    packTypeCode: '17', packTypeLabel: 'Garrafa OW',
    capacityCode: 'D5', capacityLabel: '0.25L',
    priceUnit: 'Garrafa'
  },

  // --- PEDRAS SALGADAS (H4=18) ---
  {
    id: '2000181',
    name: 'Pedras Salgadas Água Natural Gás OW 0.25L',
    brandCode: '18', brandLabel: 'Pedras',
    subBrandCode: 'PD', subBrandLabel: 'Pedras Agua',
    packTypeCode: '17', packTypeLabel: 'Garrafa OW',
    capacityCode: 'D5', capacityLabel: '0.25L',
    priceUnit: 'Garrafa'
  },

  // --- VITALIS (H4=21) ---
  {
    id: '2000211',
    name: 'Vitalis Água Mineral PET 1.5L',
    brandCode: '21', brandLabel: 'Vitalis',
    subBrandCode: 'VT', subBrandLabel: 'Água Vitalis',
    packTypeCode: '36', packTypeLabel: 'Garrafa PET',
    capacityCode: 'D4', capacityLabel: '1.5L',
    priceUnit: 'Garrafa'
  },

  // --- GUARANÁ ANTARCTICA (H4=23) ---
  {
    id: '2000231',
    name: 'Guaraná Antarctica Lata 0.33L',
    brandCode: '23', brandLabel: 'Guaraná Antarctica',
    subBrandCode: 'GU', subBrandLabel: 'Guaraná Regular',
    packTypeCode: '12', packTypeLabel: 'Lata',
    capacityCode: 'D3', capacityLabel: '0.33L',
    priceUnit: 'Lata'
  },

  // --- GATORADE (H4=24) ---
  {
    id: '2000241',
    name: 'Gatorade Laranja PET 0.50L',
    brandCode: '24', brandLabel: 'Gatorade',
    subBrandCode: 'GT', subBrandLabel: 'Isotónico Gatorade',
    packTypeCode: '36', packTypeLabel: 'Garrafa PET',
    capacityCode: 'D6', capacityLabel: '0.50L',
    priceUnit: 'Garrafa'
  },

  // --- RED BULL (H4=25) ---
  {
    id: '2000251',
    name: 'Red Bull Energy Drink Lata 0.25L',
    brandCode: '25', brandLabel: 'Red Bull',
    subBrandCode: 'RB', subBrandLabel: 'Red Bull Regular',
    packTypeCode: '12', packTypeLabel: 'Lata',
    capacityCode: 'D5', capacityLabel: '0.25L',
    priceUnit: 'Lata'
  },

  // --- SCHWEPPES (H4=26) ---
  {
    id: '2000261',
    name: 'Schweppes Água Tónica Can 0.25L',
    brandCode: '26', brandLabel: 'Schweppes',
    subBrandCode: 'SC', subBrandLabel: 'Mixers Schweppes',
    packTypeCode: '12', packTypeLabel: 'Lata',
    capacityCode: 'D5', capacityLabel: '0.25L',
    priceUnit: 'Lata'
  },

  // --- TAGUS (H4=27) ---
  {
    id: '2000271',
    name: 'Tagus Cerveja Pressão OW 0.33L',
    brandCode: '27', brandLabel: 'Tagus',
    subBrandCode: 'TG', subBrandLabel: 'Cerveja Tagus',
    packTypeCode: '17', packTypeLabel: 'Garrafa OW',
    capacityCode: 'D3', capacityLabel: '0.33L',
    priceUnit: 'Garrafa'
  },

  // --- COMPAL DA TERRA (H4=38) ---
  {
    id: '2000381',
    name: 'Compal Da Terra Tomate Pacote 1.0L',
    brandCode: '38', brandLabel: 'Compal Da Terra',
    subBrandCode: 'TR', subBrandLabel: 'Vegetais',
    packTypeCode: '24', packTypeLabel: 'Pacote Tetra',
    capacityCode: 'D1', capacityLabel: '1.0L',
    priceUnit: 'Pacote'
  },

  // --- COMPAL ESSENCIAL (H4=40) ---
  {
    id: '2000401',
    name: 'Compal Essencial Dose Fruta 0.11L',
    brandCode: '40', brandLabel: 'Compal Essencial',
    subBrandCode: 'ES', subBrandLabel: 'Dose Fruta',
    packTypeCode: '24', packTypeLabel: 'Pacote Tetra',
    capacityCode: 'D7', capacityLabel: '0.11L',
    priceUnit: 'Pacote'
  },

  // --- 7UP (H4=56) ---
  { 
    id: '2000561', 
    name: '7UP Regular Lata 0.33L', 
    brandCode: '56', brandLabel: '7up', 
    subBrandCode: 'G5', subBrandLabel: '7UP Regular', 
    packTypeCode: '12', packTypeLabel: 'Lata mítica', 
    capacityCode: 'D3', capacityLabel: '0.33L', 
    priceUnit: 'Lata'
  },

  // --- MIRINDA (H4=57) ---
  {
    id: '2000571',
    name: 'Mirinda Laranja Lata 0.33L',
    brandCode: '57', brandLabel: 'Mirinda',
    subBrandCode: 'MR', subBrandLabel: 'Mirinda Sabores',
    packTypeCode: '12', packTypeLabel: 'Lata',
    capacityCode: 'D3', capacityLabel: '0.33L',
    priceUnit: 'Lata'
  },

  // --- SHANDY (H4=89) ---
  {
    id: '2000891',
    name: 'Shandy Limão Lata 0.33L',
    brandCode: '89', brandLabel: 'Shandy',
    subBrandCode: 'SH', subBrandLabel: 'Mix Cerveja',
    packTypeCode: '12', packTypeLabel: 'Lata',
    capacityCode: 'D3', capacityLabel: '0.33L',
    priceUnit: 'Lata'
  }
];

// Helper to compute unique lists while retaining explicit Code + Label keys
export interface KeyComboH4 {
  code: string;
  label: string;
}

export interface KeyComboH4_H6 {
  id: string; // "brandCode|packTypeCode"
  brandCode: string;
  brandLabel: string;
  packTypeCode: string;
  packTypeLabel: string;
}

export interface KeyComboH4_H5 {
  id: string; // "brandCode|subBrandCode"
  brandCode: string;
  brandLabel: string;
  subBrandCode: string;
  subBrandLabel: string;
}

export interface KeyComboH4_H6_H7 {
  id: string; // "brandCode|packTypeCode|capacityCode"
  brandCode: string;
  brandLabel: string;
  packTypeCode: string;
  packTypeLabel: string;
  capacityCode: string;
  capacityLabel: string;
}

export interface KeyComboH4_H5_H6_H7 {
  id: string; // "brandCode|subBrandCode|packTypeCode|capacityCode"
  brandCode: string;
  brandLabel: string;
  subBrandCode: string;
  subBrandLabel: string;
  packTypeCode: string;
  packTypeLabel: string;
  capacityCode: string;
  capacityLabel: string;
}

export const getUniqueH4 = (catalog: CatalogItem[] = mockCatalog): KeyComboH4[] => {
  const map = new Map<string, string>();
  catalog.forEach(item => {
    if (item.brandCode && item.brandLabel) {
      map.set(item.brandCode, item.brandLabel);
    }
  });
  return Array.from(map.entries()).map(([code, label]) => ({ code, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const getUniqueH4_H6 = (catalog: CatalogItem[] = mockCatalog): KeyComboH4_H6[] => {
  const map = new Map<string, Omit<KeyComboH4_H6, 'id'>>();
  catalog.forEach(item => {
    const key = `${item.brandCode}|${item.packTypeCode}`;
    if (!map.has(key)) {
      map.set(key, {
        brandCode: item.brandCode,
        brandLabel: item.brandLabel,
        packTypeCode: item.packTypeCode,
        packTypeLabel: item.packTypeLabel
      });
    }
  });
  return Array.from(map.entries()).map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => a.brandLabel.localeCompare(b.brandLabel) || a.packTypeLabel.localeCompare(b.packTypeLabel));
};

export const getUniqueH4_H5 = (catalog: CatalogItem[] = mockCatalog): KeyComboH4_H5[] => {
  const map = new Map<string, Omit<KeyComboH4_H5, 'id'>>();
  catalog.forEach(item => {
    const key = `${item.brandCode}|${item.subBrandCode}`;
    if (!map.has(key)) {
      map.set(key, {
        brandCode: item.brandCode,
        brandLabel: item.brandLabel,
        subBrandCode: item.subBrandCode,
        subBrandLabel: item.subBrandLabel
      });
    }
  });
  return Array.from(map.entries()).map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => a.brandLabel.localeCompare(b.brandLabel) || a.subBrandLabel.localeCompare(b.subBrandLabel));
};

export const getUniqueH4_H6_H7 = (catalog: CatalogItem[] = mockCatalog): KeyComboH4_H6_H7[] => {
  const map = new Map<string, Omit<KeyComboH4_H6_H7, 'id'>>();
  catalog.forEach(item => {
    const key = `${item.brandCode}|${item.packTypeCode}|${item.capacityCode}`;
    if (!map.has(key)) {
      map.set(key, {
        brandCode: item.brandCode,
        brandLabel: item.brandLabel,
        packTypeCode: item.packTypeCode,
        packTypeLabel: item.packTypeLabel,
        capacityCode: item.capacityCode,
        capacityLabel: item.capacityLabel
      });
    }
  });
  return Array.from(map.entries()).map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => 
      a.brandLabel.localeCompare(b.brandLabel) || 
      a.packTypeLabel.localeCompare(b.packTypeLabel) || 
      a.capacityLabel.localeCompare(b.capacityLabel)
    );
};

export const getUniqueH4_H5_H6_H7 = (catalog: CatalogItem[] = mockCatalog): KeyComboH4_H5_H6_H7[] => {
  const map = new Map<string, Omit<KeyComboH4_H5_H6_H7, 'id'>>();
  catalog.forEach(item => {
    const key = `${item.brandCode}|${item.subBrandCode}|${item.packTypeCode}|${item.capacityCode}`;
    if (!map.has(key)) {
      map.set(key, {
        brandCode: item.brandCode,
        brandLabel: item.brandLabel,
        subBrandCode: item.subBrandCode,
        subBrandLabel: item.subBrandLabel,
        packTypeCode: item.packTypeCode,
        packTypeLabel: item.packTypeLabel,
        capacityCode: item.capacityCode,
        capacityLabel: item.capacityLabel
      });
    }
  });
  return Array.from(map.entries()).map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => 
      a.brandLabel.localeCompare(b.brandLabel) || 
      a.subBrandLabel.localeCompare(b.subBrandLabel) || 
      a.packTypeLabel.localeCompare(b.packTypeLabel) || 
      a.capacityLabel.localeCompare(b.capacityLabel)
    );
};
