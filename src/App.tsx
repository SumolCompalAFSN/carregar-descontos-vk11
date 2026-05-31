import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Layers, 
  SlidersHorizontal, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Grid, 
  RefreshCw, 
  Trash2, 
  Info, 
  UserCheck, 
  Calendar,
  Lock,
  Database,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  mockClients,
  CatalogItem,
  getUniqueH4,
  getUniqueH4_H6,
  getUniqueH4_H5,
  getUniqueH4_H6_H7,
  getUniqueH4_H5_H6_H7,
} from './data';

import {
  loadCatalogMetadata,
  loadCatalogCombos,
  loadCatalogMaterials,
} from './lib/catalog';

// Definition of discount record structure
interface DiscountRecord {
  discountPercent: string; // String to support natural typing including decimals or empty State
  startDate?: string;      // YYYY-MM-DD (Historically allowed, now read-only today)
  endDate: string;         // YYYY-MM-DD
}

// Map key -> DiscountRecord
type DiscountMap = Record<string, DiscountRecord>;

export default function App() {
 // Dynamic date helpers (HOJE)
  const toISODate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const now = new Date();

  const COCKPIT_TODAY = toISODate(now);

  const currentMonthEnd = (() => {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return toISODate(lastDay);
  })();

  const currentYearEnd = `${now.getFullYear()}-12-31`;

  // Setup flow controls
  const [target, setTarget] = useState<'PAGADOR' | 'HQ' | null>(null);
  const [modo, setModo] = useState<'CARREGAR_1X' | 'ACRESCENTAR' | 'SUBSTITUIR' | null>(null);
  const [targetCode, setTargetCode] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [materialSearch, setMaterialSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'H4' | 'H4_H6' | 'H4_H5' | 'H4_H6_H7' | 'H4_H5_H6_H7' | 'Material'>('H4');

  // Dynamic Active Catalog and Material states loaded from central publisher or cache (No default mock)
  const [activeCatalog, setActiveCatalog] = useState<CatalogItem[]>([]);
  const [activeMaterials, setActiveMaterials] = useState<any[]>([]);

  // Published Catalog Metadata
  const [catalogVersion, setCatalogVersion] = useState<string>("");
  const [catalogUpdatedAt, setCatalogUpdatedAt] = useState<string>("");
  const [catalogSource, setCatalogSource] = useState<string>("");

  // Loading and lock states
  const [isFetchingCatalog, setIsFetchingCatalog] = useState<boolean>(true);
  const [catalogLoadError, setCatalogLoadError] = useState<string | null>(null);

  // Admin route checking and protection
  const isAdminRoute = false;
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return sessionStorage.getItem('sap_admin_password') || '';
  });
  const [adminIsAuthenticated, setAdminIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('sap_admin_authenticated') === 'true';
  });

  // Preview spaces for Admin Upload
  const [tempCatalog, setTempCatalog] = useState<CatalogItem[] | null>(null);
  const [tempMaterials, setTempMaterials] = useState<any[] | null>(null);
  const [tempSource, setTempSource] = useState<string>('');
  const [customVersion, setCustomVersion] = useState<string>('');

 // Initial load from published static catalog JSON (GitHub Pages model)
  React.useEffect(() => {
    async function loadCatalog() {
      setIsFetchingCatalog(true);
      setCatalogLoadError(null);

      try {
        // 1) Metadata first
        const metadata = await loadCatalogMetadata();

        const cachedVersion = localStorage.getItem('sap_vk11_version');
        const cachedUpdatedAt = localStorage.getItem('sap_vk11_updated_at');
        const cachedCatalog = localStorage.getItem('sap_vk11_catalog');
        const cachedMaterials = localStorage.getItem('sap_vk11_materials');

        const parsedVersion = cachedVersion ? JSON.parse(cachedVersion) : null;
        const parsedUpdatedAt = cachedUpdatedAt ? JSON.parse(cachedUpdatedAt) : null;

        if (
          parsedVersion === metadata.catalog_version &&
          parsedUpdatedAt === metadata.updated_at &&
          cachedCatalog &&
          cachedMaterials
        ) {
          // Cache still valid
          setActiveCatalog(JSON.parse(cachedCatalog));
          setActiveMaterials(JSON.parse(cachedMaterials));
          setCatalogVersion(metadata.catalog_version);
          setCatalogUpdatedAt(metadata.updated_at);
          setCatalogSource(metadata.source_file);
          setIsFetchingCatalog(false);
          return;
        }

        // 2) Load fresh static JSON
        const [combosRaw, materialsRaw] = await Promise.all([
          loadCatalogCombos(),
          loadCatalogMaterials(),
        ]);

        // 3) Convert combo JSON -> CatalogItem[]
        const combosData: CatalogItem[] = combosRaw.map((row, index) => ({
          id: `${row.H4_code}|${row.H5_code}|${row.H6_code}|${row.H7_code}|${index}`,
          name: [row.H4_label, row.H5_label, row.H6_label, row.H7_label].filter(Boolean).join(' | '),
          brandCode: row.H4_code,
          brandLabel: row.H4_label,
          subBrandCode: row.H5_code,
          subBrandLabel: row.H5_label,
          packTypeCode: row.H6_code,
          packTypeLabel: row.H6_label,
          capacityCode: row.H7_code,
          capacityLabel: row.H7_label,
          priceUnit: 'UN',
        }));

        // 4) Convert materials JSON -> current UI shape
        const materialsData = materialsRaw.map((row) => ({
          id: row.material_code,
          name: row.material_label,
          brandCode: '',
          subBrandCode: '',
          packTypeCode: '',
          capacityCode: '',
        }));

        // 5) Commit into state
        setActiveCatalog(combosData);
        setActiveMaterials(materialsData);
        setCatalogVersion(metadata.catalog_version);
        setCatalogUpdatedAt(metadata.updated_at);
        setCatalogSource(metadata.source_file);

        // 6) Cache locally for faster reload
        localStorage.setItem('sap_vk11_catalog', JSON.stringify(combosData));
        localStorage.setItem('sap_vk11_materials', JSON.stringify(materialsData));
        localStorage.setItem('sap_vk11_version', JSON.stringify(metadata.catalog_version));
        localStorage.setItem('sap_vk11_updated_at', JSON.stringify(metadata.updated_at));
        localStorage.setItem('sap_vk11_source', JSON.stringify(metadata.source_file));
      } catch (err: any) {
        console.error('Erro ao carregar catálogo estático:', err);

        // fallback to cache only
        const cachedCatalog = localStorage.getItem('sap_vk11_catalog');
        const cachedMaterials = localStorage.getItem('sap_vk11_materials');
        const cachedVersion = localStorage.getItem('sap_vk11_version');
        const cachedUpdatedAt = localStorage.getItem('sap_vk11_updated_at');
        const cachedSource = localStorage.getItem('sap_vk11_source');

        if (cachedCatalog && cachedMaterials && cachedVersion) {
          setActiveCatalog(JSON.parse(cachedCatalog));
          setActiveMaterials(JSON.parse(cachedMaterials));
          setCatalogVersion(JSON.parse(cachedVersion));
          if (cachedUpdatedAt) setCatalogUpdatedAt(JSON.parse(cachedUpdatedAt));
          if (cachedSource) setCatalogSource(JSON.parse(cachedSource));

          setToastMessage('Aviso: catálogo carregado a partir da cache local.');
          setTimeout(() => setToastMessage(null), 5000);
        } else {
          setCatalogLoadError('Catálogo central não encontrado. Verifique se os ficheiros JSON existem em public/catalog/.');
        }
      } finally {
        setIsFetchingCatalog(false);
      }
    }

    loadCatalog();
  }, []);

  // Excel-like input states for the 6 different tabs
  const [h4Discounts, setH4Discounts] = useState<DiscountMap>({});
  const [h4H6Discounts, setH4H6Discounts] = useState<DiscountMap>({});
  const [h4H5Discounts, setH4H5Discounts] = useState<DiscountMap>({});
  const [h4H6H7Discounts, setH4H6H7Discounts] = useState<DiscountMap>({});
  const [h4H5H6H7Discounts, setH4H5H6H7Discounts] = useState<DiscountMap>({});
  const [materialDiscounts, setMaterialDiscounts] = useState<DiscountMap>({});

  // Selection state for line checkpoints (checkboxes) per tab segment
  const [selectedKeys, setSelectedKeys] = useState<Record<string, Set<string>>>({
    H4: new Set(),
    H4_H6: new Set(),
    H4_H5: new Set(),
    H4_H6_H7: new Set(),
    H4_H5_H6_H7: new Set(),
    Material: new Set()
  });

  // Pagination states to prevent DOM bloating when navigating "Todas" (ALL)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25); // Default page size (25 items)

  // Custom Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Edit Option States for validTo
  const [bulkValidToOption, setBulkValidToOption] = useState<'aberto' | 'fim_mes' | 'fim_ano' | 'especifica'>('aberto');
  const [bulkValidToSpecificDate, setBulkValidToSpecificDate] = useState<string>(COCKPIT_TODAY);
  const [bulkScope, setBulkScope] = useState<'visiveis' | 'selecionadas'>('visiveis');
  const [bulkConfirmPreview, setBulkConfirmPreview] = useState<{ count: number; date: string; keys: string[] } | null>(null);

  // General % bulk propagator input controls
  const [bulkPctInput, setBulkPctInput] = useState<string>('');

  // Clean formatted date printer helper
  const formatDateToPT = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Populate realistic sample data using actual codes mapping to catalog
  const handleLoadSampleData = () => {
    // Brand (H4) prefilled (Compal = '10', Sumol = '13')
    setH4Discounts({
  '10': { discountPercent: '5.250', endDate: currentYearEnd },
  '13': { discountPercent: '8.450', endDate: currentYearEnd },
});

    // Brand + Pack Type (H4+H6) prefilled
    setH4H6Discounts({
  '13|12': { discountPercent: '12.000', endDate: currentMonthEnd },
  '14|36': { discountPercent: '3.750', endDate: currentYearEnd },
});

    // Brand + SubBrand (H4+H5) prefilled
   setH4H5Discounts({
  '10|E7': { discountPercent: '9.500', endDate: currentYearEnd },
});

    // Brand + Pack Type + Capacity (H4+H6+H7)
    setH4H6H7Discounts({
  '56|12|D3': { discountPercent: '15.125', endDate: currentMonthEnd },
});

    // Material prefilled (valid 7-digit SKU material codes)
    setMaterialDiscounts({
  '2000101': { discountPercent: '10.500', endDate: currentMonthEnd },
  '2000131': { discountPercent: '18.000', endDate: currentYearEnd },
});

    // Set Target, Modo, and TargetCode automatically for rapid presentation
    setTarget('PAGADOR');
    setModo('CARREGAR_1X');
    setTargetCode('');
  };

  // Reset all states helper
  const handleReset = () => {
    setH4Discounts({});
    setH4H6Discounts({});
    setH4H5Discounts({});
    setH4H6H7Discounts({});
    setH4H5H6H7Discounts({});
    setMaterialDiscounts({});
    setSelectedKeys({
      H4: new Set(),
      H4_H6: new Set(),
      H4_H5: new Set(),
      H4_H6_H7: new Set(),
      H4_H5_H6_H7: new Set(),
      Material: new Set()
    });
    setBulkPctInput('');
    setBulkConfirmPreview(null);
    setTarget(null);
    setModo(null);
    setTargetCode('');
    setMaterialSearch('');
    setCurrentPage(1);
  };

  // High-performance parser for official Codigos-Base.xlsx spreadsheet - Mapped into Temp Preview
  const handleCatalogUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let materialsTabName = workbook.SheetNames.find(n => n.includes('1º DescontosPorMaterial') || n.includes('1') || n.toLowerCase().includes('material') || n.toLowerCase().includes('desconto'));
        let combinationsTabName = workbook.SheetNames.find(n => n.includes('2º') || n.includes('2') || n.toLowerCase().includes('marsub') || n.toLowerCase().includes('comb'));

        if (!materialsTabName) {
          materialsTabName = workbook.SheetNames[0];
        }
        if (!combinationsTabName) {
          combinationsTabName = workbook.SheetNames[1] || workbook.SheetNames[0];
        }

        // Parse combinations
        let parsedCatalog: CatalogItem[] = [];
        if (combinationsTabName) {
          const sheet = workbook.Sheets[combinationsTabName];
          const json: any[] = XLSX.utils.sheet_to_json(sheet);
          
          json.forEach((row, index) => {
            const keys = Object.keys(row);
            const findVal = (patterns: string[]) => {
              const matchedKey = keys.find(k => patterns.some(p => k.toLowerCase().replace(/_/g, '').includes(p.toLowerCase())));
              return matchedKey ? String(row[matchedKey]).trim() : '';
            };

            const brandCode = findVal(['h4code', 'h4marca', 'marca', 'h4_code', 'h4_marca_codigo', 'codmarca', 'm_cod', 'brandcode']);
            const brandLabel = findVal(['h4label', 'h4designacao', 'h4designação', 'h4_label', 'h4_marca_designacao', 'designacaomarca', 'marca_designacao', 'brandlabel', 'm_designacao']);
            
            const subBrandCode = findVal(['h5code', 'h5submarca', 'submarca', 'h5_code', 'h5_submarca_codigo', 'codsubmarca', 'sb_cod', 'subbrandcode']);
            const subBrandLabel = findVal(['h5label', 'h5designacao', 'h5designação', 'h5_label', 'h5_submarca_designacao', 'subbrandlabel', 'sb_designacao']);

            const packTypeCode = findVal(['h6code', 'h6embalagem', 'embalagem', 'h6_code', 'h6_embalagem_codigo', 'codembalagem', 'emb_cod', 'packtypecode']);
            const packTypeLabel = findVal(['h6label', 'h6designacao', 'h6designação', 'h6_label', 'h6_embalagem_designacao', 'packtypelabel', 'emb_designacao']);

            const capacityCode = findVal(['h7code', 'h7capacidade', 'capacidade', 'h7_code', 'h7_capacidade_codigo', 'codcapacidade', 'cap_cod', 'capacitycode']);
            const capacityLabel = findVal(['h7label', 'h7designacao', 'h7designação', 'h7_label', 'h7_capacidade_designacao', 'capacitylabel', 'cap_designacao']);

            if (brandCode && brandLabel) {
              parsedCatalog.push({
                id: findVal(['sku', 'codmaterial', 'artigo', 'codigo', 'cod']) || `${brandCode}-${subBrandCode}-${packTypeCode}-${capacityCode}-${index}`,
                name: findVal(['designacao', 'designação', 'descricao', 'descrição', 'label', 'artigo_desc']) || `${brandLabel} ${subBrandLabel} ${packTypeLabel} ${capacityLabel}`,
                brandCode,
                brandLabel,
                subBrandCode: subBrandCode || 'N/A',
                subBrandLabel: subBrandLabel || 'N/A',
                packTypeCode: packTypeCode || 'N/A',
                packTypeLabel: packTypeLabel || 'N/A',
                capacityCode: capacityCode || 'N/A',
                capacityLabel: capacityLabel || 'N/A',
                priceUnit: findVal(['unidade', 'priceunit', 'un']) || 'UN'
              });
            }
          });
        }

        // Parse individual SKU materials (1º DescontosPorMaterial)
        let parsedMaterials: any[] = [];
        if (materialsTabName) {
          const sheet = workbook.Sheets[materialsTabName];
          const json: any[] = XLSX.utils.sheet_to_json(sheet);
          
          json.forEach((row) => {
            const keys = Object.keys(row);
            const findVal = (patterns: string[]) => {
              const matchedKey = keys.find(k => patterns.some(p => k.toLowerCase().replace(/_/g, '').trim() === p.toLowerCase()));
              return matchedKey ? String(row[matchedKey]).trim() : '';
            };
            
            const cod = findVal(['cod', 'id', 'material', 'cod_material', 'codigo', 'artigo', 'sku']);
            const designacao = findVal(['designação', 'designacao', 'descrição', 'descricao', 'label', 'nome']);
            
            if (cod && designacao) {
              let brandCode = '';
              if (cod.startsWith('2000')) {
                brandCode = cod.substring(4, 6);
              }
              parsedMaterials.push({
                id: cod,
                name: designacao,
                brandCode: brandCode || undefined
              });
            }
          });
        }

        if (parsedCatalog.length > 0 && parsedMaterials.length > 0) {
          setTempCatalog(parsedCatalog);
          setTempMaterials(parsedMaterials);
          setTempSource(file.name);
          
          const timeCode = new Date().toISOString().slice(11,16).replace(':', '');
          const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '.');
          setCustomVersion(`v${dateStr}.${timeCode}`);
          
          setToastMessage(`Ficheiro Excel carregado com sucesso!\nAba de Materiais: ${parsedMaterials.length} SKUs\nAba de Combinações: ${parsedCatalog.length} linhas.\n\nPor favor, insira a versão e faça 'Gravar & Publicar' no painel Admin.`);
          setTimeout(() => setToastMessage(null), 8000);
        } else {
          alert(`Inconsistência na estrutura das abas: \nMateriais detetados: ${parsedMaterials.length} \nCombinações detetadas: ${parsedCatalog.length}`);
        }

      } catch (error: any) {
        alert(`Erro ao ler o ficheiro excel: ${error.message || error}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Authenticate admin password on server-side
  const handleVerifyAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/catalog/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });
      if (res.ok) {
        setAdminIsAuthenticated(true);
        sessionStorage.setItem('sap_admin_password', adminPassword);
        sessionStorage.setItem('sap_admin_authenticated', 'true');
        setToastMessage("Autenticação de administrador efetuada com sucesso!");
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        const err = await res.json();
        alert(err.error || "Palavra-passe incorreta!");
      }
    } catch (err) {
      alert("Erro de rede ao ligar ao servidor para autenticação.");
    }
  };

  // Commit and Publish the loaded sheets to production server (Central Single Source of Truth + Cache sync)
  const handlePublishCatalog = async () => {
    if (!tempCatalog || !tempMaterials) {
      alert("Nenhum ficheiro processado para publicar!");
      return;
    }

    const resolvedVersion = customVersion.trim() || `v${new Date().toISOString().slice(0, 10).replace(/-/g, '.')}`;

    try {
      const res = await fetch('/api/catalog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          combos: tempCatalog,
          materials: tempMaterials,
          version: resolvedVersion,
          source: tempSource,
          password: adminPassword
        })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Falha na publicação.");
        return;
      }

      const reply = await res.json();
      const dateStamp = reply.metadata.updatedAt;

      // 1. Commit states locally
      setActiveCatalog(tempCatalog);
      setActiveMaterials(tempMaterials);
      setCatalogVersion(resolvedVersion);
      setCatalogUpdatedAt(dateStamp);
      setCatalogSource(tempSource);

      // 2. Persists actively in Client-side localStorage for offline and refresh support (Cache sync)
      localStorage.setItem('sap_vk11_catalog', JSON.stringify(tempCatalog));
      localStorage.setItem('sap_vk11_materials', JSON.stringify(tempMaterials));
      localStorage.setItem('sap_vk11_version', JSON.stringify(resolvedVersion));
      localStorage.setItem('sap_vk11_updated_at', JSON.stringify(dateStamp));
      localStorage.setItem('sap_vk11_source', JSON.stringify(tempSource));

      // Clear temp spaces
      setTempCatalog(null);
      setTempMaterials(null);
      setTempSource('');
      setCustomVersion('');

      // Reset seller UI pagination/filter to default to adapt instantly to newly uploaded portfolio
      setBrandFilter('ALL');
      setCurrentPage(1);

      // Set seller load error of missing catalog back to null since catalog is now published!
      setCatalogLoadError(null);

      setToastMessage(`SUCESSO: Novo Catálogo Ativo Publicado!\nVersão: ${resolvedVersion}\nGravado no servidor e partilhado centralmente com todos os vendedores.`);
      setTimeout(() => setToastMessage(null), 6000);
    } catch (err) {
      alert("Erro ao comunicar com o servidor de publicação central.");
    }
  };

  // Row selection handlers
  const toggleRowSelected = (tab: string, key: string) => {
    setSelectedKeys(prev => {
      const nextSet = new Set(prev[tab]);
      if (nextSet.has(key)) {
        nextSet.delete(key);
      } else {
        nextSet.add(key);
      }
      return { ...prev, [tab]: nextSet };
    });
  };

  const handleToggleSelectAll = (visibleKeys: string[]) => {
    setSelectedKeys(prev => {
      const currentTabSet = prev[activeTab];
      const allSelected = visibleKeys.every(k => currentTabSet.has(k));
      const nextSet = new Set(currentTabSet);
      if (allSelected) {
        visibleKeys.forEach(k => nextSet.delete(k));
      } else {
        visibleKeys.forEach(k => nextSet.add(k));
      }
      return { ...prev, [activeTab]: nextSet };
    });
  };

  // Generate lists of currently visible keys under filters for selection actions
  const visibleKeysForTab = useMemo<string[]>(() => {
    if (activeTab === 'H4') {
      return getUniqueH4(activeCatalog).filter(b => brandFilter === 'ALL' || b.code === brandFilter).map(b => b.code);
    } else if (activeTab === 'H4_H6') {
      return getUniqueH4_H6(activeCatalog).filter(b => brandFilter === 'ALL' || b.brandCode === brandFilter).map(b => b.id);
    } else if (activeTab === 'H4_H5') {
      return getUniqueH4_H5(activeCatalog).filter(b => brandFilter === 'ALL' || b.brandCode === brandFilter).map(b => b.id);
    } else if (activeTab === 'H4_H6_H7') {
      return getUniqueH4_H6_H7(activeCatalog).filter(b => brandFilter === 'ALL' || b.brandCode === brandFilter).map(b => b.id);
    } else if (activeTab === 'H4_H5_H6_H7') {
      return getUniqueH4_H5_H6_H7(activeCatalog).filter(b => brandFilter === 'ALL' || b.brandCode === brandFilter).map(b => b.id);
    } else { // Material
      return activeMaterials.filter(b => {
        const matchesSearch = materialSearch.trim() === '' || 
          b.id.includes(materialSearch.trim()) || 
          b.name.toLowerCase().includes(materialSearch.toLowerCase());
        return matchesSearch;
      }).map(b => b.id);
    }
  }, [activeTab, brandFilter, materialSearch, activeCatalog, activeMaterials]);

  // Setup filteredRows of combinations/items based on Brand Filter and Search string
  const filteredRows = useMemo<any[]>(() => {
    if (activeTab === 'H4') {
      return getUniqueH4(activeCatalog).filter(item => brandFilter === 'ALL' || item.code === brandFilter);
    } else if (activeTab === 'H4_H6') {
      return getUniqueH4_H6(activeCatalog).filter(item => brandFilter === 'ALL' || item.brandCode === brandFilter);
    } else if (activeTab === 'H4_H5') {
      return getUniqueH4_H5(activeCatalog).filter(item => brandFilter === 'ALL' || item.brandCode === brandFilter);
    } else if (activeTab === 'H4_H6_H7') {
      return getUniqueH4_H6_H7(activeCatalog).filter(item => brandFilter === 'ALL' || item.brandCode === brandFilter);
    } else if (activeTab === 'H4_H5_H6_H7') {
      return getUniqueH4_H5_H6_H7(activeCatalog).filter(item => brandFilter === 'ALL' || item.brandCode === brandFilter);
    } else { // Material
      return activeMaterials.filter(item => {
        const matchesSearch = materialSearch.trim() === '' || 
          item.id.includes(materialSearch.trim()) || 
          item.name.toLowerCase().includes(materialSearch.toLowerCase());
        return matchesSearch;
      });
    }
  }, [activeTab, brandFilter, materialSearch, activeCatalog, activeMaterials]);

  // Paginated partition of rows to display
 // No pagination: always show all filtered rows
const paginatedRows = useMemo<any[]>(() => {
  return filteredRows;
}, [filteredRows]);
  // No pagination: always one logical page
const totalPages = 1;


  // Compute calculated values for Bulk Edit Options
  const calculatedBulkTargetDate = useMemo<string>(() => {
    if (bulkValidToOption === 'aberto') {
      return ''; // vazio representa 31/12/9999 no export
    } else if (bulkValidToOption === 'fim_mes') {
      return currentMonthEnd;
    } else if (bulkValidToOption === 'fim_ano') {
      return currentYearEnd;
    } else {
      return bulkValidToSpecificDate;
    }
  }, [bulkValidToOption, bulkValidToSpecificDate, currentMonthEnd, currentYearEnd]);

  // Handle preparing the Bulk Edit validTo modal/confirm segment
  const handlePrepareBulkValidTo = () => {
    let keysToApply: string[] = [];
    if (bulkScope === 'selecionadas') {
      keysToApply = Array.from(selectedKeys[activeTab]);
    } else {
      keysToApply = visibleKeysForTab;
    }

    if (keysToApply.length === 0) {
      alert(
        bulkScope === 'selecionadas'
          ? 'Nenhum registo selecionado! Por favor marque pelo menos uma caixa de seleção.'
          : 'Nenhum registo disponível sob as regras de filtro atuais.'
      );
      return;
    }

    const targetDate = calculatedBulkTargetDate === '' ? '31/12/9999' : calculatedBulkTargetDate;

    if (keysToApply.length <= 200) {
      // 1) Apply directly!
      const updateMap = (prev: DiscountMap) => {
        const nextMap = { ...prev };
        keysToApply.forEach(k => {
          const current = nextMap[k] || { discountPercent: '', endDate: '' };
          nextMap[k] = {
            ...current,
            endDate: calculatedBulkTargetDate
          };
        });
        return nextMap;
      };

      if (activeTab === 'H4') setH4Discounts(updateMap);
      else if (activeTab === 'H4_H6') setH4H6Discounts(updateMap);
      else if (activeTab === 'H4_H5') setH4H5Discounts(updateMap);
      else if (activeTab === 'H4_H6_H7') setH4H6H7Discounts(updateMap);
      else if (activeTab === 'H4_H5_H6_H7') setH4H5H6H7Discounts(updateMap);
      else if (activeTab === 'Material') setMaterialDiscounts(updateMap);

      // Reset selection state
      setSelectedKeys(prev => ({ ...prev, [activeTab]: new Set() }));

      // Display a beautiful visual toast
      setToastMessage(`Aplicado a ${keysToApply.length} linhas (${formatDateToPT(targetDate)})`);
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      // 2) Must trigger warning preview block for > 200 rows!
      setBulkConfirmPreview({
        count: keysToApply.length,
        date: formatDateToPT(targetDate),
        keys: keysToApply
      });
    }
  };

  // Run bulk update propagation (only for elements triggered > 200)
  const handleConfirmBulkValidTo = () => {
    if (!bulkConfirmPreview) return;
    const { keys, date } = bulkConfirmPreview;
    
    // Convert PT date back to standard YYYY-MM-DD for state storage
    let storedDate = '';
    if (date !== '31/12/9999') {
      const parts = date.split('/');
      if (parts.length === 3) {
        storedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const updateMap = (prev: DiscountMap) => {
      const nextMap = { ...prev };
      keys.forEach(k => {
        const current = nextMap[k] || { discountPercent: '', endDate: '' };
        nextMap[k] = {
          ...current,
          endDate: storedDate
        };
      });
      return nextMap;
    };

    if (activeTab === 'H4') setH4Discounts(updateMap);
    else if (activeTab === 'H4_H6') setH4H6Discounts(updateMap);
    else if (activeTab === 'H4_H5') setH4H5Discounts(updateMap);
    else if (activeTab === 'H4_H6_H7') setH4H6H7Discounts(updateMap);
    else if (activeTab === 'H4_H5_H6_H7') setH4H5H6H7Discounts(updateMap);
    else if (activeTab === 'Material') setMaterialDiscounts(updateMap);

    // Clean selection and close preview block
    setSelectedKeys(prev => ({ ...prev, [activeTab]: new Set() }));
    setBulkConfirmPreview(null);
    setToastMessage(`Aplicado a ${keys.length} linhas (${date})`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick Apply % mass values propagates to visible or selected combinations
  const handleApplyPctBulkValue = () => {
    if (!bulkPctInput) return;
    const cleanPct = bulkPctInput.trim().replace(',', '.');
    if (isNaN(parseFloat(cleanPct))) {
      alert('Introduza um valor numérico válido para a percentagem.');
      return;
    }

    let keysToApply = visibleKeysForTab;
    if (bulkScope === 'selecionadas') {
      keysToApply = Array.from(selectedKeys[activeTab]);
    }

    if (keysToApply.length === 0) {
      alert('Por favor selecione registos ou altere os filtros antes de aplicar.');
      return;
    }

    const updateMap = (prev: DiscountMap) => {
      const next = { ...prev };
      keysToApply.forEach(k => {
        const current = next[k] || { discountPercent: '', endDate: '' };
        next[k] = { ...current, discountPercent: bulkPctInput };
      });
      return next;
    };

    if (activeTab === 'H4') setH4Discounts(updateMap);
    else if (activeTab === 'H4_H6') setH4H6Discounts(updateMap);
    else if (activeTab === 'H4_H5') setH4H5Discounts(updateMap);
    else if (activeTab === 'H4_H6_H7') setH4H6H7Discounts(updateMap);
    else if (activeTab === 'H4_H5_H6_H7') setH4H5H6H7Discounts(updateMap);
    else if (activeTab === 'Material') setMaterialDiscounts(updateMap);
  };

  // Clear single active tab selection completely
  const handleClearCurrentTab = () => {
    if (activeTab === 'H4') setH4Discounts({});
    else if (activeTab === 'H4_H6') setH4H6Discounts({});
    else if (activeTab === 'H4_H5') setH4H5Discounts({});
    else if (activeTab === 'H4_H6_H7') setH4H6H7Discounts({});
    else if (activeTab === 'H4_H5_H6_H7') setH4H5H6H7Discounts({});
    else if (activeTab === 'Material') setMaterialDiscounts({});
    
    setSelectedKeys(prev => ({ ...prev, [activeTab]: new Set() }));
  };

  // Handle single grid state update
  const updateDiscountInput = (
    tab: typeof activeTab,
    keyId: string,
    field: keyof DiscountRecord,
    value: string
  ) => {
    const updateMap = (prev: DiscountMap) => {
      const current = prev[keyId] || { discountPercent: '', endDate: '' };
      return {
        ...prev,
        [keyId]: {
          ...current,
          [field]: value
        }
      };
    };

    if (tab === 'H4') setH4Discounts(updateMap);
    else if (tab === 'H4_H6') setH4H6Discounts(updateMap);
    else if (tab === 'H4_H5') setH4H5Discounts(updateMap);
    else if (tab === 'H4_H6_H7') setH4H6H7Discounts(updateMap);
    else if (tab === 'H4_H5_H6_H7') setH4H5H6H7Discounts(updateMap);
    else if (tab === 'Material') setMaterialDiscounts(updateMap);
  };

  // Validation Engine assessing business constraints
  const validationAlerts = useMemo(() => {
    const alerts: { type: 'ERROR' | 'WARNING'; message: string; code: string }[] = [];

    // Master context check rules
    if (!target) {
      alerts.push({ 
        type: 'ERROR', 
        message: 'Falta selecionar o TARGET obrigatório (PAGADOR ou HQ).', 
        code: 'VAL-HDR-01' 
      });
    }
    if (!modo) {
      alerts.push({ 
        type: 'ERROR', 
        message: 'Falta selecionar o MODO obrigatório de carregamento SAP.', 
        code: 'VAL-HDR-02' 
      });
    }
    if (!/^\d{7}$/.test(targetCode)) {
      alerts.push({ 
        type: 'ERROR', 
        message: `Código do TargetCode '${targetCode}' é inválido! Deve conter exatamente 7 dígitos numéricos (sem letras ou espaços).`, 
        code: 'VAL-HDR-03' 
      });
    }

    // Capture valid dimensions arrays
    const validH4s = new Set(activeCatalog.map(x => x.brandCode));
    const validH5s = new Set(activeCatalog.map(x => x.subBrandCode));
    const validH6s = new Set(activeCatalog.map(x => x.packTypeCode));
    const validH7s = new Set(activeCatalog.map(x => x.capacityCode));
    const validMaterials = new Set(activeMaterials.map(x => x.id));

    // Audit and validate records
    const auditRecordSet = (map: DiscountMap, tableName: string, type: typeof activeTab) => {
      Object.entries(map).forEach(([key, record]) => {
        const cleanPct = record.discountPercent.trim().replace(',', '.');
        if (cleanPct === '' || cleanPct === '0' || parseFloat(cleanPct) === 0) {
          // treat as not completed, skip exporter
          return;
        }

        const pctValue = parseFloat(cleanPct);

        // Rule 1: J-Discount valid bounds (min 0.001, max 99.999)
        if (isNaN(pctValue) || pctValue < 0.001 || pctValue > 99.999) {
          alerts.push({
            type: 'ERROR',
            message: `[${tableName}] Linha "${key}": Desconto de ${record.discountPercent}% inválido. Deve situar-se entre 0.001% e 99.999% (100% proibido).`,
            code: 'VAL-DISC-RANGE'
          });
        }

        // Rule 2: Precision limit checks (sap compatibility up to 3 decimal places)
        const dotIndex = cleanPct.indexOf('.');
        if (dotIndex !== -1) {
          const decimalPart = cleanPct.substring(dotIndex + 1);
          if (decimalPart.length > 3) {
            alerts.push({
              type: 'ERROR',
              message: `[${tableName}] Linha "${key}": Desconto ${record.discountPercent}% possui mais de 3 casas decimais (exige múltiplo de 0.001%).`,
              code: 'VAL-PRECISION-ERROR'
            });
          }
        }

        // Rule 3: End date constraint (must be >= Today)
        if (record.endDate) {
          if (record.endDate < COCKPIT_TODAY) {
            alerts.push({
              type: 'ERROR',
              message: `[${tableName}] Linha "${key}": Data de Fim (${formatDateToPT(record.endDate)}) não pode ser anterior a HOJE (${formatDateToPT(COCKPIT_TODAY)}).`,
              code: 'VAL-DATE-PAST'
            });
          }
        }

        // Rule 4: Dimension integrity and anti-mixing enforcement
        if (type === 'H4') {
          if (!validH4s.has(key)) {
            alerts.push({
              type: 'ERROR',
              message: `[Integridade Dimensão] Código Brand '${key}' não existe como marca legítima no Catálogo Ativo. Mistura ilegal proibida.`,
              code: 'VAL-DIM-INTEGRITY'
            });
          }
        } else if (type === 'H4_H6') {
          const [h4, h6] = key.split('|');
          if (!validH4s.has(h4) || !validH6s.has(h6)) {
            alerts.push({
              type: 'ERROR',
              message: `[Integridade Dimensão] Mistura de dimensões em H4+H6: Marca (${h4}) ou Embalagem (${h6}) inválida ou incoerente com o Catálogo Ativo.`,
              code: 'VAL-DIM-INTEGRITY'
            });
          }
        } else if (type === 'H4_H5') {
          const [h4, h5] = key.split('|');
          if (!validH4s.has(h4) || !validH5s.has(h5)) {
            alerts.push({
              type: 'ERROR',
              message: `[Integridade Dimensão] Mistura de dimensões em H4+H5: Marca (${h4}) ou SubMarca (${h5}) inválida ou incoerente com o Catálogo Ativo.`,
              code: 'VAL-DIM-INTEGRITY'
            });
          }
        } else if (type === 'H4_H6_H7') {
          const [h4, h6, h7] = key.split('|');
          if (!validH4s.has(h4) || !validH6s.has(h6) || !validH7s.has(h7)) {
            alerts.push({
              type: 'ERROR',
              message: `[Integridade Dimensão] Mistura ilegal em H4+H6+H7: Marca (${h4}), Embalagem (${h6}) ou Capacidade (${h7}) externa à dimensão correta.`,
              code: 'VAL-DIM-INTEGRITY'
            });
          }
        } else if (type === 'H4_H5_H6_H7') {
          const [h4, h5, h6, h7] = key.split('|');
          if (!validH4s.has(h4) || !validH5s.has(h5) || !validH6s.has(h6) || !validH7s.has(h7)) {
            alerts.push({
              type: 'ERROR',
              message: `[Integridade Dimensão] Mistura ilegal em Todo o Nível: Código incorreto detetado entre Marca (${h4}), SubMarca (${h5}), Embalagem (${h6}) ou Capacidade (${h7}).`,
              code: 'VAL-DIM-INTEGRITY'
            });
          }
        } else if (type === 'Material') {
          if (!validMaterials.has(key)) {
            alerts.push({
              type: 'ERROR',
              message: `[Integridade Dimensão] Código Material '${key}' inexistente ou inconsistente no Catálogo Ativo.`,
              code: 'VAL-DIM-INTEGRITY'
            });
          }
        }
      });
    };

    auditRecordSet(h4Discounts, 'Nível H4 (Marca)', 'H4');
    auditRecordSet(h4H6Discounts, 'Nível H4+H6', 'H4_H6');
    auditRecordSet(h4H5Discounts, 'Nível H4+H5', 'H4_H5');
    auditRecordSet(h4H6H7Discounts, 'Nível H4+H6+H7', 'H4_H6_H7');
    auditRecordSet(h4H5H6H7Discounts, 'Nível Completo H4+H5+H6+H7', 'H4_H5_H6_H7');
    auditRecordSet(materialDiscounts, 'Nível Material Artigo', 'Material');

    // Rule 5: Same key overlapping checks blocks export (CRITICAL ERROR)
    // Structure operates as Map records where key is intrinsically unique, saving from duplicate row overlap errors.
    // However, if we evaluate the exported list, we explicitly enforce date overlap checkers.
    const checkKeyOverlaps = (map: DiscountMap, labelName: string) => {
      // Formally verify if active keys have empty/duplicate intervals
      const entries = (Object.entries(map) as [string, DiscountRecord][]).filter(([_, rec]) => {
        const disc = rec.discountPercent.trim().replace(',', '.');
        return disc !== '' && disc !== '0' && parseFloat(disc) > 0;
      });

      // Simple checker mapping: since a Map physically restricts keys, any same key is exactly one row.
      // But we will write this check explicitly to guarantee safety and fulfill specs.
      const keyCount: Record<string, number> = {};
      entries.forEach(([key]) => {
        keyCount[key] = (keyCount[key] || 0) + 1;
        if (keyCount[key] > 1) {
          alerts.push({
            type: 'ERROR',
            message: `[Sobreposição Chaves] Presença duplicada da mesma chave "${key}" no segmento ${labelName} com períodos de vigência sobrepostos. Exportação bloqueada.`,
            code: 'VAL-OVERLAP-BLOQUEANTE'
          });
        }
      });
    };

    checkKeyOverlaps(h4Discounts, 'Marca (H4)');
    checkKeyOverlaps(h4H6Discounts, 'Marca+Embalagem (H4+H6)');
    checkKeyOverlaps(h4H5Discounts, 'Marca+SubMarca (H4+H5)');
    checkKeyOverlaps(h4H6H7Discounts, 'Marca+Embalagem+Capacidade (H4+H6+H7)');
    checkKeyOverlaps(h4H5H6H7Discounts, 'Completo H4+H5+H6+H7');
    checkKeyOverlaps(materialDiscounts, 'Material SAP');

    // Warning Warnings levels: visual alert warning for nesting overlapping hierarchies (H4 vs Material / etc.)
    (Object.entries(h4Discounts) as [string, DiscountRecord][]).forEach(([brandCode, entry]) => {
      if (!entry.discountPercent) return;
      const cleanPct = entry.discountPercent.trim().replace(',', '.');
      if (cleanPct === '' || parseFloat(cleanPct) === 0) return;

      // H4_H6 nested check
      (Object.entries(h4H6Discounts) as [string, DiscountRecord][]).forEach(([subKey, subEntry]) => {
        if (!subEntry.discountPercent) return;
        const subClean = subEntry.discountPercent.trim().replace(',', '.');
        if (subClean === '' || parseFloat(subClean) === 0) return;

        const [bCode] = subKey.split('|');
        if (bCode === brandCode) {
          alerts.push({
            type: 'WARNING',
            message: `Nesting de Cobertura: Desconto ativo em Marca Geral (${brandCode}) concorre com desconto específico Marca+Embalagem (${subKey}). O SAP VK11 adota a prioridade mais restrita.`,
            code: 'VAL-OVERLAY-WARNING'
          });
        }
      });

      // Material nested check
      (Object.entries(materialDiscounts) as [string, DiscountRecord][]).forEach(([matId, subEntry]) => {
        if (!subEntry.discountPercent) return;
        const subClean = subEntry.discountPercent.trim().replace(',', '.');
        if (subClean === '' || parseFloat(subClean) === 0) return;

        const matchedItem = activeCatalog.find(x => x.id === matId) as any || activeMaterials.find(x => x.id === matId);
        const matchedBrandCode = matchedItem?.brandCode || (matId.startsWith('2000') ? matId.substring(4, 6) : '');
        if (matchedItem && matchedBrandCode === brandCode) {
          alerts.push({
            type: 'WARNING',
            message: `Nesting de Cobertura: Desconto em Marca Geral (${brandCode}) concorre diretamente com nível específico Artigo SAP (${matId} - ${matchedItem.name}).`,
            code: 'VAL-OVERLAY-SPECIFIC'
          });
        }
      });
    });

    return alerts;
  }, [target, modo, h4Discounts, h4H6Discounts, h4H5Discounts, h4H6H7Discounts, h4H5H6H7Discounts, materialDiscounts, activeCatalog, activeMaterials]);

  // Count active entries containing valid discounts
  const filledCounts = useMemo(() => {
    const checkFilled = (map: DiscountMap) => {
      return (Object.values(map) as DiscountRecord[]).filter(r => {
        const val = r.discountPercent.trim().replace(',', '.');
        return val !== '' && val !== '0' && parseFloat(val) > 0;
      }).length;
    };
    return {
      H4: checkFilled(h4Discounts),
      H4_H6: checkFilled(h4H6Discounts),
      H4_H5: checkFilled(h4H5Discounts),
      H4_H6_H7: checkFilled(h4H6H7Discounts),
      H4_H5_H6_H7: checkFilled(h4H5H6H7Discounts),
      Material: checkFilled(materialDiscounts)
    };
  }, [h4Discounts, h4H6Discounts, h4H5Discounts, h4H6H7Discounts, h4H5H6H7Discounts, materialDiscounts]);

  const totalFilled = useMemo<number>(() => {
    return filledCounts.H4 + filledCounts.H4_H6 + filledCounts.H4_H5 + filledCounts.H4_H6_H7 + filledCounts.H4_H5_H6_H7 + filledCounts.Material;
  }, [filledCounts]);

  const hasCriticalError = useMemo(() => {
    return validationAlerts.some(a => a.type === 'ERROR');
  }, [validationAlerts]);

  // Excel vk11 builder export sheet logic
  const handleExportSAPExcel = () => {
    if (hasCriticalError) {
      alert('Impossível Exportar: Corrija os erros e conflitos críticos apontados pelo validador.');
      return;
    }
    if (totalFilled === 0) {
      alert('Nenhum desconto cadastrado e preenchido para exportar.');
      return;
    }

    const wb = XLSX.utils.book_new();
    const clientCode = targetCode;
    const cleanModo = modo || 'SUBSTITUIR';

    // Format helper for end date
    const resolveEndDate = (dateStr?: string) => {
      if (!dateStr || dateStr.trim() === '') {
        return "31/12/9999";
      }
      return formatDateToPT(dateStr);
    };

    // 1. Level H4: targetCode | H4_code | desconto_J | validFrom | validTo
    const h4Rows: any[] = [];
    (Object.entries(h4Discounts) as [string, DiscountRecord][]).forEach(([brandCode, rec]) => {
      const pctStr = rec.discountPercent.trim().replace(',', '.');
      if (pctStr === '' || pctStr === '0' || parseFloat(pctStr) === 0) return;

      h4Rows.push({
        'targetCode': clientCode,
        'H4_code': brandCode,
        'desconto_J': parseFloat(pctStr),
        'validFrom': formatDateToPT(COCKPIT_TODAY),
        'validTo': resolveEndDate(rec.endDate),
      });
    });
    if (h4Rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(h4Rows);
      XLSX.utils.book_append_sheet(wb, ws, 'H4 (Marca)');
    }

    // 2. Level H4_H6: targetCode | H4_code | H6_code | desconto_J | validFrom | validTo
    const h4h6Rows: any[] = [];
    (Object.entries(h4H6Discounts) as [string, DiscountRecord][]).forEach(([key, rec]) => {
      const pctStr = rec.discountPercent.trim().replace(',', '.');
      if (pctStr === '' || pctStr === '0' || parseFloat(pctStr) === 0) return;

      const [brandCode, packTypeCode] = key.split('|');
      h4h6Rows.push({
        'targetCode': clientCode,
        'H4_code': brandCode,
        'H6_code': packTypeCode,
        'desconto_J': parseFloat(pctStr),
        'validFrom': formatDateToPT(COCKPIT_TODAY),
        'validTo': resolveEndDate(rec.endDate),
      });
    });
    if (h4h6Rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(h4h6Rows);
      XLSX.utils.book_append_sheet(wb, ws, 'H4+H6 (Embalagem)');
    }

    // 3. Level H4_H5: targetCode | H4_code | H5_code | desconto_J | validFrom | validTo
    const h4h5Rows: any[] = [];
    (Object.entries(h4H5Discounts) as [string, DiscountRecord][]).forEach(([key, rec]) => {
      const pctStr = rec.discountPercent.trim().replace(',', '.');
      if (pctStr === '' || pctStr === '0' || parseFloat(pctStr) === 0) return;

      const [brandCode, subBrandCode] = key.split('|');
      h4h5Rows.push({
        'targetCode': clientCode,
        'H4_code': brandCode,
        'H5_code': subBrandCode,
        'desconto_J': parseFloat(pctStr),
        'validFrom': formatDateToPT(COCKPIT_TODAY),
        'validTo': resolveEndDate(rec.endDate),
      });
    });
    if (h4h5Rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(h4h5Rows);
      XLSX.utils.book_append_sheet(wb, ws, 'H4+H5 (SubMarca)');
    }

    // 4. Level H4_H6_H7: targetCode | H4_code | H6_code | H7_code | desconto_J | validFrom | validTo
    const h4h6h7Rows: any[] = [];
    (Object.entries(h4H6H7Discounts) as [string, DiscountRecord][]).forEach(([key, rec]) => {
      const pctStr = rec.discountPercent.trim().replace(',', '.');
      if (pctStr === '' || pctStr === '0' || parseFloat(pctStr) === 0) return;

      const [brandCode, packTypeCode, capacityCode] = key.split('|');
      h4h6h7Rows.push({
        'targetCode': clientCode,
        'H4_code': brandCode,
        'H6_code': packTypeCode,
        'H7_code': capacityCode,
        'desconto_J': parseFloat(pctStr),
        'validFrom': formatDateToPT(COCKPIT_TODAY),
        'validTo': resolveEndDate(rec.endDate),
      });
    });
    if (h4h6h7Rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(h4h6h7Rows);
      XLSX.utils.book_append_sheet(wb, ws, 'H4+H6+H7');
    }

    // 5. Level H4_H5_H6_H7: targetCode | H4_code | H5_code | H6_code | H7_code | desconto_J | validFrom | validTo
    const h4h5h6h7Rows: any[] = [];
    (Object.entries(h4H5H6H7Discounts) as [string, DiscountRecord][]).forEach(([key, rec]) => {
      const pctStr = rec.discountPercent.trim().replace(',', '.');
      if (pctStr === '' || pctStr === '0' || parseFloat(pctStr) === 0) return;

      const [brandCode, subBrandCode, packTypeCode, capacityCode] = key.split('|');
      h4h5h6h7Rows.push({
        'targetCode': clientCode,
        'H4_code': brandCode,
        'H5_code': subBrandCode,
        'H6_code': packTypeCode,
         'H7_code': capacityCode,
        'desconto_J': parseFloat(pctStr),
        'validFrom': formatDateToPT(COCKPIT_TODAY),
        'validTo': resolveEndDate(rec.endDate),
      });
    });
    if (h4h5h6h7Rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(h4h5h6h7Rows);
      XLSX.utils.book_append_sheet(wb, ws, 'H4+H5+H6+H7');
    }

    // 6. Level Material: targetCode | material_code | desconto_J | validFrom | validTo
    const materialRows: any[] = [];
    (Object.entries(materialDiscounts) as [string, DiscountRecord][]).forEach(([matId, rec]) => {
      const pctStr = rec.discountPercent.trim().replace(',', '.');
      if (pctStr === '' || pctStr === '0' || parseFloat(pctStr) === 0) return;

      materialRows.push({
        'targetCode': clientCode,
        'material_code': matId,
        'desconto_J': parseFloat(pctStr),
        'validFrom': formatDateToPT(COCKPIT_TODAY),
        'validTo': resolveEndDate(rec.endDate),
      });
    });
    if (materialRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(materialRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Material SAP');
    }

    XLSX.writeFile(wb, `SAP_VK11_Descontos_${clientCode}_${cleanModo}.xlsx`);
  };

  // 1. Loading screen during Central SAP cache synchronization
  if (isFetchingCatalog) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 relative font-sans">
        <div className="absolute inset-0 bg-slate-950 opacity-50 z-0" />
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-6 relative z-10">
          <div className="flex justify-center">
            <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-bold tracking-tight">Sincronização SAP VK11</h2>
            <p className="text-slate-400 text-xs">
              A carregar portfólio comercial centralizado...
            </p>
          </div>
          <div className="pt-2">
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-blue-500 h-full w-3/4 animate-pulse" />
            </div>
          </div>
          <p className="text-[9px] text-slate-500 font-mono">
            Fonte: Servidor Oficial Sumol+Compal
          </p>
        </div>
      </div>
    );
  }

  // 2. Block screen for Sellers if catalog has never been published on the server
  if (catalogLoadError && !isAdminRoute) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-rose-100 p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-full border border-rose-100">
              <AlertTriangle className="w-10 h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-rose-600 tracking-tight">Acesso Bloqueado</h2>
            <p className="text-xs text-slate-550 max-w-xs mx-auto leading-relaxed">
              Não existe nenhum <strong>Catálogo Ativo</strong> publicado centralmente pela Administração de Vendas. O cockpit necessita deste referencial para garantir a governança tributária de códigos VK11.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-205 text-left space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Sseller Notice</span>
            <span className="text-[11px] text-slate-600 block">Por favor, contacte a Equipa Comercial Admin para efetuar o primeiro upload lido a partir do ficheiro SAP oficial.</span>
          </div>
         <div className="pt-3">
  <div className="inline-flex w-full items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
    <Lock className="w-3.5 h-3.5 text-slate-400" />
    <span>Catálogo central não publicado</span>
  </div>
</div>
        </div>
      </div>
    );
  }

  // 3. Password Verification page for Admin Route Protection
  if (isAdminRoute && !adminIsAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl max-w-sm w-full space-y-6 relative">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-500 text-white p-2.5 rounded-xl shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Painel Admin SAP</h2>
              <p className="text-slate-400 text-[10px]">Autenticação de Segurança</p>
            </div>
          </div>
          
          <form onSubmit={handleVerifyAdmin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Senha de Acesso
              </label>
              <input
                type="password"
                required
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-sky-500 font-mono"
                placeholder="Insira a password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-md transition"
            >
              Autenticar e Entrar
            </button>
          </form>

          <div className="pt-2 text-center">
            <a 
              href="/" 
              className="text-[11px] text-amber-500 hover:underline font-semibold"
            >
              ← Voltar ao Cockpit Vendedor
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 4. Secure Admin Dashboard View to Parse, Convert, and Dynamically Publish Central Portfolio JSONs
  if (isAdminRoute && adminIsAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col antialiased">
        {/* Top admin info */}
        <div className="bg-slate-950 text-slate-350 text-[11px] px-6 py-2 border-b border-slate-850 flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 font-semibold text-sky-400 font-mono tracking-wider">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse mr-1 inline-block" />
              <span>SISTEMA CENTRAL DE GOVERNAÇÃO SAP (MODELO B REAL)</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Versão Central Ativa: <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-mono">{catalogVersion || "Vazia"}</strong></span>
            {catalogUpdatedAt && <span className="text-slate-400">Publicado em: {formatDateToPT(catalogUpdatedAt.slice(0,10))}</span>}
          </div>
        </div>

        {/* Administration Header */}
        <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-505 bg-sky-600 text-white p-2.5 rounded-xl">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Gestão Comercial e Auditoria SAP VK11
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-normal">
                  Consola Admin
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Efetue o upload do arquivo oficial para convertê-lo e publicá-lo como fonte única central para todos os computadores.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="/"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
            >
              <span>← Ver Workspace Vendedor</span>
            </a>
            <button
              onClick={() => {
                sessionStorage.removeItem('sap_admin_authenticated');
                sessionStorage.removeItem('sap_admin_password');
                setAdminIsAuthenticated(false);
              }}
              className="px-3.5 py-2 bg-rose-950 text-rose-300 hover:bg-rose-900 rounded-lg text-xs font-bold transition"
            >
              Terminar Sessão
            </button>
          </div>
         </header>

         {/* Admin Dashboard Area */}
         <div className="flex-1 p-6 flex flex-col space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
          
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col space-y-4">
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-sky-500" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-205 text-sm text-white">Publicação de Catálogo Centralizado (Fonte Única)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Converta o ficheiro oficial de códigos <strong className="text-slate-200">Codigos-Base.xlsx</strong> recebido do SAP.
                </p>
              </div>
              <div>
                <label className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow transition">
                  <Download className="w-4 h-4 rotate-180" />
                  <span>Selecionar Codigos-Base.xlsx</span>
                  <input
                    id="catalog-upload-input"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCatalogUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* PREVIEW AND PUBLICATION DETAILS */}
            {tempCatalog && tempMaterials ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mt-4 space-y-4">
                <div className="flex items-center space-x-2 text-amber-400 bg-amber-950/30 px-3 py-2 rounded-lg border border-amber-900/40 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <strong>ATENÇÃO:</strong> Os dados lidos encontram-se em visualização temporária. Clique em <strong>Gravar & Publicar</strong> para converter formalmente e publicar no servidor.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-850">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Nome do Arquivo</span>
                    <span className="text-xs font-bold text-slate-300 truncate">{tempSource}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Integração de Cobertura</span>
                    <span className="text-xs font-bold text-sky-400">
                      Duas abas encontradas e analisadas
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Aba de SKUs (Materials)</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{tempMaterials.length} SKUs</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Aba de Combinações (Combos)</span>
                    <span className="text-xs font-bold text-blue-400 font-mono">{tempCatalog.length} linhas</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end gap-4 pt-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                      Identificador Oficial de Versão <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-sky-500"
                      placeholder="Ex: v1.8.3 ou 2026.05.28"
                      value={customVersion}
                      onChange={(e) => setCustomVersion(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTempCatalog(null);
                        setTempMaterials(null);
                        setTempSource('');
                        setCustomVersion('');
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold transition"
                    >
                      Remover Ficheiro
                    </button>
                    <button
                      onClick={handlePublishCatalog}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-lg text-xs shadow hover:from-emerald-700 transition"
                    >
                      Gravar & Publicar Catálogo Comercial Ativo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 text-center text-xs text-slate-405 text-slate-400">
                Aguardando upload de <strong className="text-slate-200">Codigos-Base.xlsx</strong> recebido diretamente do SAP.
              </div>
            )}
          </div>

          {/* ACTIVE GOVERNANCE SUMMARY */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <h3 className="font-bold text-sm text-slate-100 mb-4">Estado de Distribuição Comercial VK11</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block">Versão de Produção</span>
                <span className="text-xl font-extrabold text-sky-400 font-mono mt-1 block">{catalogVersion || "Catálogo não publicado - Inoperacional"}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block">Data de Publicação</span>
                <span className="text-xl font-extrabold text-slate-300 font-mono mt-1 block">
                  {catalogUpdatedAt ? `${formatDateToPT(catalogUpdatedAt.slice(0,10))} às ${catalogUpdatedAt.slice(11,16)}` : "Não aplicável"}
                </span>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block">Origem do Arquivo Lido</span>
                <span className="text-xs font-bold text-slate-400 truncate mt-2 block">
  {catalogSource || 'Nenhum catálogo publicado'}
</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Status Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-600 text-white font-semibold text-xs px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-500 whitespace-pre-line animate-bounce">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // REAL CENTRALIZED VENDEDOR COCKPIT VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Info Bar */}
    

      {/* Seller Header */}
     <header className="bg-white border-b border-slate-200 sticky top-0 z-45 px-6 py-4 shadow-xs">
  <div className="max-w-[1235px] w-full mx-auto flex items-center justify-between gap-4">
    
    {/* Lado esquerdo */}
<div className="flex items-center gap-3 min-w-0">
  <div className="bg-amber-500 text-white p-2.5 rounded-xl shadow-md flex-shrink-0">
    <FileSpreadsheet className="w-5 h-5 animate-pulse" />
  </div>

  <div className="flex flex-col min-w-0">
    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
      Carregamento de Descontos
    </h1>

    <div className="flex items-center gap-3 mt-0.5 text-[11px]">
      <span className="text-slate-500 whitespace-nowrap">
        Versão <span className="text-slate-500">{catalogVersion}</span>
      </span>

      <span className="text-slate-400 whitespace-nowrap">
        {catalogUpdatedAt ? formatDateToPT(catalogUpdatedAt.slice(0, 10)) : '—'}
      </span>
    </div>
  </div>
</div>

    {/* Lado direito */}
    <div className="flex items-center flex-shrink-0">
      <button
        onClick={handleReset}
        className="flex items-center space-x-1.5 px-4 py-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition border border-slate-200 bg-white text-xs font-semibold"
        title="Limpar todos os campos"
      >
        <RefreshCw className="w-3.5 h-3.5 text-slate-450" />
        <span>Limpar Cockpit</span>
      </button>
    </div>
  </div>
</header>
      {/* Main Area */}
      <div className="flex-1 p-6 flex flex-col space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
        

        {/* STEP 1: PARÂMETROS OBRIGATÓRIOS DO TOPO */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-amber-500" />
          
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center space-x-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
              <span>Carregamento de Descontos no Cliente</span>
            </h2>
            {target && modo ? (
              <span className="text-xs text-green-600 font-semibold flex items-center space-x-1 bg-green-50 px-2 py-1 rounded">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Pronto</span>
              </span>
            ) : (
              <span className="text-xs text-rose-500 font-semibold flex items-center space-x-1 bg-rose-50 px-2 py-1 rounded">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Pendente</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TARGET */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                1. TARGET DE CARREGAMENTO <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTarget('PAGADOR')}
                  className={`px-4 py-3 rounded-lg border text-sm font-semibold transition flex flex-col items-center justify-center space-y-1 ${
                    target === 'PAGADOR'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-bold">PAGADOR</span>
                  <span className="text-[10px] opacity-80">Por Cliente Único</span>
                </button>
                <button
                  onClick={() => setTarget('HQ')}
                  className={`px-4 py-3 rounded-lg border text-sm font-semibold transition flex flex-col items-center justify-center space-y-1 ${
                    target === 'HQ'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-bold">HQ</span>
                  <span className="text-[10px] opacity-80">Por Hirerquia</span>
                </button>
              </div>
            </div>

            {/* MODO */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                2. MODO DE CARREGAMENTO <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['CARREGAR_1X', 'ACRESCENTAR', 'SUBSTITUIR'] as const).map(m => {
                  const label = m === 'CARREGAR_1X' ? '1ª Vez' : m === 'ACRESCENTAR' ? 'Acrescentar' : 'Substituir';
                  const desc = m === 'CARREGAR_1X' ? 'Inicial' : m === 'ACRESCENTAR' ? 'Adiciona Descontos aos Existentes' : 'Substitui Todos os Existentes';
                  return (
                    <button
                      key={m}
                      onClick={() => setModo(m)}
                      className={`px-1 py-3 rounded-lg border text-[11px] font-semibold transition flex flex-col items-center justify-center ${
                        modo === m
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold text-center">{label}</span>
                      <span className="text-[9px] opacity-80 text-center">{desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free TargetCode input with strict 7-digit validation and catalog display lookup */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                3. CÓDIGO DO CLIENTE <span className="text-rose-500">*</span>
              </label>
              {target ? (
                <div>
                  <input
  type="text"
  maxLength={7}
  placeholder="Cod. Cliente"
  value={targetCode}
  onChange={(e) => setTargetCode(e.target.value)}
  className={`w-44 h-11 px-3 bg-white border rounded-lg text-xs font-semibold text-slate-800 focus:outline-none ${
    targetCode.trim() === ''
      ? 'border-slate-300 focus:ring-1 focus:ring-blue-500'
      : /^\d{7}$/.test(targetCode)
      ? 'border-slate-300 focus:ring-1 focus:ring-blue-500'
      : 'border-rose-300 focus:ring-1 focus:ring-rose-500'
  }`}
/>
                 {targetCode.trim() !== '' && (
  <p className="text-[11px] mt-1.5 flex items-center">
    {/^\d{7}$/.test(targetCode) ? (
      (() => {
        const matchedClient = mockClients.find(
          c => c.code === targetCode && c.type === target
        );

        return matchedClient ? (
          <span className="text-emerald-700 flex items-center gap-1.5 font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Nome (Lookup): <strong>{matchedClient.name}</strong>
            </span>
          </span>
        ) : (
          <span className="text-emerald-700 flex items-center gap-1.5 font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Código válido</span>
          </span>
        );
      })()
    ) : (
      <span className="text-rose-500 font-semibold flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        <span>Introduza exatamente 7 dígitos numéricos.</span>
      </span>
    )}
  </p>
)}
                </div>
              ) : (
                <div className="h-11 border border-dashed border-slate-200 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs px-2 text-center">
                  Escolha o TARGET (PAGADOR / HQ) para vincular a conta do cliente.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STEP 2: THE COCKPIT TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col overflow-hidden">
          
          {!target || !modo ? (
            <div className="p-12 text-center bg-slate-50 flex flex-col items-center justify-center space-y-3">
              <Lock className="w-10 h-10 text-slate-450" />
              <h3 className="text-sm font-bold text-slate-700">Painel de Grelha Bloqueado</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Selecione um <strong>Target</strong> e um <strong>Modo de Carregamento</strong> acima para habilitar o preenchimento da grelha de descontos.
              </p>
              <button
                onClick={handleLoadSampleData}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Ativar Demonstração Prática
              </button>
            </div>
          ) : (
            <>
              {/* Table Controls Header */}
              <div className="px-5 py-4 border-b border-slate-150 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">2</span>
                  <h3 className="font-bold text-slate-800 text-sm">Painel de Controlo de Preenchimento</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-extrabold flex items-center space-x-1">
                    <span>{totalFilled}</span>
                    <span className="scale-90 font-normal">items ativos</span>
                  </span>
                </div>

                {/* Filter and reset actions */}
                <div className="flex items-center space-x-3">
                  {activeTab !== 'Material' && (
                    <>
                      <div className="flex items-center space-x-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-600">Filtrar por Marca:</span>
                      </div>
                      <select
                        value={brandFilter}
                        onChange={(e) => {
                          setBrandFilter(e.target.value);
                          // Clear selections on filter change to prevent accidental bulk updates
                          setSelectedKeys(prev => ({ ...prev, [activeTab]: new Set() }));
                        }}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="ALL">Todas as Marcas (H4)</option>
                        {getUniqueH4(activeCatalog).map(b => (
                          <option key={b.code} value={b.code}>{b.label}</option>
                        ))}
                      </select>
                    </>
                  )}

                  {activeTab === 'Material' && (
                    <input
                      type="text"
                      placeholder="Pesquisar SKU / Label..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-blue-500 w-44 shadow-xs"
                    />
                  )}

                  <button
                    onClick={handleClearCurrentTab}
                    className="text-xs flex items-center space-x-1 text-slate-600 hover:text-rose-600 transition bg-white px-2.5 py-1.5 rounded-md border border-slate-300"
                    title="Limpar todos os dados desta aba"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Aba</span>
                  </button>
                </div>
              </div>

             {/* TABS SEGMENTS */}
<div className="border-b border-slate-200 bg-slate-50 px-4 pt-2">
  <nav className="flex gap-1 overflow-x-auto" aria-label="Tabs">
    {[
      { key: 'H4', label: 'H4 (Marca)', count: filledCounts.H4 },
      { key: 'H4_H6', label: 'H4 + H6', count: filledCounts.H4_H6 },
      { key: 'H4_H5', label: 'H4 + H5', count: filledCounts.H4_H5 },
      { key: 'H4_H6_H7', label: 'H4+H6+H7', count: filledCounts.H4_H6_H7 },
      { key: 'H4_H5_H6_H7', label: 'H4+H5+H6+H7', count: filledCounts.H4_H5_H6_H7 },
      { key: 'Material', label: 'Material', count: filledCounts.Material },
    ].map((tab) => {
      const isSelected = activeTab === tab.key;

      return (
        <button
          key={tab.key}
          onClick={() => {
            setActiveTab(tab.key as any);
            setSelectedKeys(prev => ({ ...prev, [tab.key]: new Set() }));
          }}
          className={`relative -mb-px px-4 py-3 rounded-t-xl border text-xs font-semibold whitespace-nowrap transition focus:outline-none ${
            isSelected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 border-b-emerald-50 shadow-sm z-10'
              : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs">{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold">
                {tab.count}
              </span>
            )}
          </div>
        </button>
      );
    })}
  </nav>
</div>


              {/* THE SPREADSHEET */}
              <div className="max-h-[360px] overflow-auto border-t-0 border border-slate-200 relative bg-emerald">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 sticky top-0 z-15 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      {/* Checkboxes header */}
                     <th className="py-2.5 px-2 border-r border-slate-200 w-10 text-center bg-slate-50 sticky left-0 z-10 shadow-r">
                        <input
                          type="checkbox"
                          checked={visibleKeysForTab.length > 0 && visibleKeysForTab.every(key => (selectedKeys[activeTab] || new Set()).has(key))}
                          onChange={() => handleToggleSelectAll(visibleKeysForTab)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </th>
                      
                      
                      
                      {(activeTab === 'H4' || activeTab === 'H4_H6' || activeTab === 'H4_H5' || activeTab === 'H4_H6_H7' || activeTab === 'H4_H5_H6_H7') && (
                        <th className="py-2.5 px-3 border-r border-slate-200 w-40 text-slate-700">H4 (MARCA)</th>
                      )}
                      {(activeTab === 'H4_H5' || activeTab === 'H4_H5_H6_H7') && (
                       <th className="py-2.5 px-3 border-r border-slate-200 w-38 text-slate-700">H5 (SUBMARCA)</th>
                      )}
                      {(activeTab === 'H4_H6' || activeTab === 'H4_H6_H7' || activeTab === 'H4_H5_H6_H7') && (
                        <th className="py-2.5 px-3 border-r border-slate-200 w-36 text-slate-700">H6 (EMBALAGEM)</th>
                      )}
                      {(activeTab === 'H4_H6_H7' || activeTab === 'H4_H5_H6_H7') && (
                       <th className="py-2.5 px-3 border-r border-slate-200 w-28 text-slate-700">H7 (CAPACIDADE)</th>
                      )}
                      
                      {activeTab === 'Material' && (
                        <>
                          <th className="py-2.5 px-3 border-r border-slate-200 w-32 text-slate-700 font-extrabold">MATERIAL (ARTIGO)</th>
                         <th className="py-2.5 px-3 border-r border-slate-200 w-56 text-slate-700">DESIGNAÇÃO (ARTIGO)</th>
                          
                        </>
                      )}
                      
                      {/* INPUT FIELDS COLUMNS - COLORED AMBER FOR EXCEL CONVENTION */}
                     <th className="py-2.5 px-3 border-r border-slate-200 text-amber-900 bg-amber-50/80 font-extrabold text-center w-32">
                        Desconto %
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-slate-500 bg-slate-50 font-bold text-center w-28 select-none">
                        Data Início
                      </th>
                      <th className="py-2.5 px-3 text-amber-905 bg-amber-50/80 font-extrabold text-center w-32">
                        Válido até
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px] sm:text-xs">
                    
                    {/* TAB H4 */}
                    {activeTab === 'H4' && paginatedRows.map(item => {
                        const record = h4Discounts[item.code] || { discountPercent: '', endDate: '' };
                        const hasVal = record.discountPercent && parseFloat(record.discountPercent.replace(',', '.')) !== 0;
                        const isSelected = (selectedKeys.H4 || new Set()).has(item.code);
                        return (
                          <tr key={item.code} className={`hover:bg-slate-50 transition-colors ${hasVal ? 'bg-blue-50/15' : ''} ${isSelected ? 'bg-blue-100/20' : ''}`}>
                            <td className="py-2 px-3 border-r border-slate-200 text-center sticky left-0 z-10 bg-white/40 shadow-r">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleRowSelected('H4', item.code)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                              />
                            </td>
                            
                            <td className="py-2 px-4 border-r border-slate-200 font-semibold text-slate-900">
  <span className="truncate">{item.label}</span>
</td>
                            
                            {/* YELLOW INPUT CELLS */}
                            <td className="py-1 px-3 border-r border-slate-200 bg-amber-50/10">
                              <div className="flex items-center space-x-1 justify-center">
                                <input
                                  type="text"
                                  placeholder="0.000"
                                  value={record.discountPercent}
                                  onChange={(e) => updateDiscountInput('H4', item.code, 'discountPercent', e.target.value)}
                                  className="w-20 text-center bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded font-semibold text-slate-900 text-xs py-1"
                                />
                                <span className="text-[10px] font-bold text-amber-700">%</span>
                              </div>
                            </td>
                            {/* validFrom: READ-ONLY PRE-FILLED WITH HOJE */}
                            <td className="py-1 px-3 border-r border-slate-200 bg-slate-55 text-slate-500 font-semibold text-center select-none font-mono tracking-tight">
                              {formatDateToPT(COCKPIT_TODAY)}
                            </td>
                            {/* validTo: EDITABLE */}
                            <td className="py-1 px-3 bg-amber-50/10">
                              <input
                                type="date"
                                value={record.endDate}
                                min={COCKPIT_TODAY}
                                onChange={(e) => updateDiscountInput('H4', item.code, 'endDate', e.target.value)}
                                className="w-full text-xs font-semibold bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded text-center py-1 font-mono"
                              />
                            </td>
                          </tr>
                        );
                      })}

                    {/* TAB H4_H6 */}
                   {activeTab === 'H4_H6' && paginatedRows.map(item => {
  const record = h4H6Discounts[item.id] || { discountPercent: '', endDate: '' };
  const hasVal = record.discountPercent && parseFloat(record.discountPercent.replace(',', '.')) !== 0;
  const isSelected = (selectedKeys.H4_H6 || new Set()).has(item.id);

  return (
    <tr
      key={item.id}
      className={`hover:bg-slate-50 transition-colors ${hasVal ? 'bg-blue-50/15' : ''} ${isSelected ? 'bg-blue-100/20' : ''}`}
    >
      {/* checkbox */}
      <td className="py-2 px-3 border-r border-slate-200 text-center sticky left-0 z-10 bg-white/40 shadow-r">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleRowSelected('H4_H6', item.id)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
        />
      </td>

      {/* H4 (MARCA) */}
      <td className="py-2 px-4 border-r border-slate-200">
        <span className="font-semibold text-slate-900 truncate">{item.brandLabel}</span>
      </td>

      {/* H6 (EMBALAGEM) */}
      <td className="py-2 px-4 border-r border-slate-200">
        <span className="text-slate-800 truncate">{item.packTypeLabel}</span>
      </td>

      {/* DESCONTO */}
      <td className="py-1 px-3 border-r border-slate-200 bg-amber-50/10">
        <div className="flex items-center space-x-1 justify-center">
          <input
            type="text"
            placeholder="0.000"
            value={record.discountPercent}
            onChange={(e) => updateDiscountInput('H4_H6', item.id, 'discountPercent', e.target.value)}
            className="w-20 text-center bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded font-semibold text-slate-900 text-xs py-1"
          />
          <span className="text-[10px] font-bold text-amber-700">%</span>
        </div>
      </td>

      {/* DATA INÍCIO */}
      <td className="py-1 px-3 border-r border-slate-200 bg-slate-55 text-slate-500 font-semibold text-center select-none font-mono">
        {formatDateToPT(COCKPIT_TODAY)}
      </td>

      {/* DATA FIM */}
      <td className="py-1 px-3 bg-amber-50/10">
        <input
          type="date"
          value={record.endDate}
          min={COCKPIT_TODAY}
          onChange={(e) => updateDiscountInput('H4_H6', item.id, 'endDate', e.target.value)}
          className="w-full text-xs font-semibold bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded text-center py-1 font-mono"
        />
      </td>
    </tr>
  );
})}

                    {/* TAB H4_H5 */}
                    {activeTab === 'H4_H5' && paginatedRows.map(item => {
  const record = h4H5Discounts[item.id] || { discountPercent: '', endDate: '' };
  const hasVal = record.discountPercent && parseFloat(record.discountPercent.replace(',', '.')) !== 0;
  const isSelected = (selectedKeys.H4_H5 || new Set()).has(item.id);

  return (
    <tr
      key={item.id}
      className={`hover:bg-slate-50 transition-colors ${hasVal ? 'bg-blue-50/15' : ''} ${isSelected ? 'bg-blue-100/20' : ''}`}
    >
      {/* checkbox */}
      <td className="py-2 px-3 border-r border-slate-200 text-center sticky left-0 z-10 bg-white/40 shadow-r">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleRowSelected('H4_H5', item.id)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
        />
      </td>

      {/* H4 (MARCA) */}
      <td className="py-2 px-4 border-r border-slate-200">
        <span className="font-semibold text-slate-900 truncate">{item.brandLabel}</span>
      </td>

      {/* H5 (SUBMARCA) */}
      <td className="py-2 px-4 border-r border-slate-200">
        <span className="text-slate-800 truncate">{item.subBrandLabel}</span>
      </td>

      {/* DESCONTO */}
      <td className="py-1 px-3 border-r border-slate-200 bg-amber-50/10">
        <div className="flex items-center space-x-1 justify-center">
          <input
            type="text"
            placeholder="0.000"
            value={record.discountPercent}
            onChange={(e) => updateDiscountInput('H4_H5', item.id, 'discountPercent', e.target.value)}
            className="w-20 text-center bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded font-semibold text-slate-900 text-xs py-1"
          />
          <span className="text-[10px] font-bold text-amber-700">%</span>
        </div>
      </td>

      {/* DATA INÍCIO */}
      <td className="py-1 px-3 border-r border-slate-200 bg-slate-55 text-slate-500 font-semibold text-center select-none font-mono">
        {formatDateToPT(COCKPIT_TODAY)}
      </td>

      {/* DATA FIM */}
      <td className="py-1 px-3 bg-amber-50/10">
        <input
          type="date"
          value={record.endDate}
          min={COCKPIT_TODAY}
          onChange={(e) => updateDiscountInput('H4_H5', item.id, 'endDate', e.target.value)}
          className="w-full text-xs font-semibold bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded text-center py-1 font-mono"
        />
      </td>
    </tr>
  );
})}

                    {/* TAB H4_H6_H7 */}
                   {activeTab === 'H4_H6_H7' && paginatedRows.map(item => {
  const record = h4H6H7Discounts[item.id] || { discountPercent: '', endDate: '' };
  const hasVal = record.discountPercent && parseFloat(record.discountPercent.replace(',', '.')) !== 0;
  const isSelected = (selectedKeys.H4_H6_H7 || new Set()).has(item.id);

  return (
    <tr
      key={item.id}
      className={`hover:bg-slate-50 transition-colors ${hasVal ? 'bg-blue-50/15' : ''} ${isSelected ? 'bg-blue-100/20' : ''}`}
    >
      {/* checkbox */}
      <td className="py-2 px-3 border-r border-slate-200 text-center sticky left-0 z-10 bg-white/40 shadow-r">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleRowSelected('H4_H6_H7', item.id)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
        />
      </td>

      {/* H4 (MARCA) */}
      <td className="py-2 px-4 border-r border-slate-200">
        <span className="font-semibold text-slate-900 truncate">{item.brandLabel}</span>
      </td>

      {/* H6 (EMBALAGEM) */}
      <td className="py-2 px-4 border-r border-slate-200">
        <span className="text-slate-800 truncate">{item.packTypeLabel}</span>
      </td>

      {/* H7 (CAPACIDADE) */}
      <td className="py-2 px-4 border-r border-slate-200">
        <span className="text-slate-800 font-bold truncate">{item.capacityLabel}</span>
      </td>

      {/* DESCONTO */}
      <td className="py-1 px-3 border-r border-slate-200 bg-amber-50/10">
        <div className="flex items-center space-x-1 justify-center">
          <input
            type="text"
            placeholder="0.000"
            value={record.discountPercent}
            onChange={(e) => updateDiscountInput('H4_H6_H7', item.id, 'discountPercent', e.target.value)}
            className="w-20 text-center bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded font-semibold text-slate-900 text-xs py-1"
          />
          <span className="text-[10px] font-bold text-amber-700">%</span>
        </div>
      </td>

      {/* DATA INÍCIO */}
      <td className="py-1 px-3 border-r border-slate-200 bg-slate-55 text-slate-500 font-semibold text-center select-none font-mono">
        {formatDateToPT(COCKPIT_TODAY)}
      </td>

      {/* DATA FIM */}
      <td className="py-1 px-3 bg-amber-50/10">
        <input
          type="date"
          value={record.endDate}
          min={COCKPIT_TODAY}
          onChange={(e) => updateDiscountInput('H4_H6_H7', item.id, 'endDate', e.target.value)}
          className="w-full text-xs font-semibold bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded text-center py-1 font-mono"
        />
      </td>
    </tr>
  );
})}

                    {/* TAB H4_H5_H6_H7 */}
                    {activeTab === 'H4_H5_H6_H7' && paginatedRows.map(item => {
  const record = h4H5H6H7Discounts[item.id] || { discountPercent: '', endDate: '' };
  const hasVal = record.discountPercent && parseFloat(record.discountPercent.replace(',', '.')) !== 0;
  const isSelected = (selectedKeys.H4_H5_H6_H7 || new Set()).has(item.id);

  return (
    <tr
      key={item.id}
      className={`hover:bg-slate-50 transition-colors ${hasVal ? 'bg-blue-50/15' : ''} ${isSelected ? 'bg-blue-100/20' : ''}`}
    >
      {/* checkbox */}
      <td className="py-2 px-3 border-r border-slate-200 text-center sticky left-0 z-10 bg-white/40 shadow-r">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleRowSelected('H4_H5_H6_H7', item.id)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
        />
      </td>

      {/* H4 (MARCA) */}
      <td className="py-2 px-4 border-r border-slate-200">
        <span className="font-semibold text-slate-900 truncate">{item.brandLabel}</span>
      </td>

      {/* H5 (SUBMARCA) */}
      <td className="py-2 px-4 border-r border-slate-200">
        <span className="text-slate-800 truncate">{item.subBrandLabel}</span>
      </td>

      {/* H6 (EMBALAGEM) */}
      <td className="py-2 px-4 border-r border-slate-200">
        <span className="text-slate-800 truncate">{item.packTypeLabel}</span>
      </td>

      {/* H7 (CAPACIDADE) */}
      <td className="py-2 px-4 border-r border-slate-200">
        <span className="text-slate-800 font-bold truncate">{item.capacityLabel}</span>
      </td>

      {/* DESCONTO */}
      <td className="py-1 px-3 border-r border-slate-200 bg-amber-50/10">
        <div className="flex items-center space-x-1 justify-center">
          <input
            type="text"
            placeholder="0.000"
            value={record.discountPercent}
            onChange={(e) => updateDiscountInput('H4_H5_H6_H7', item.id, 'discountPercent', e.target.value)}
            className="w-20 text-center bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded font-semibold text-slate-900 text-xs py-1"
          />
          <span className="text-[10px] font-bold text-amber-700">%</span>
        </div>
      </td>

      {/* DATA INÍCIO */}
      <td className="py-1 px-3 border-r border-slate-200 bg-slate-55 text-slate-500 font-semibold text-center select-none font-mono">
        {formatDateToPT(COCKPIT_TODAY)}
      </td>

      {/* DATA FIM */}
      <td className="py-1 px-3 bg-amber-50/10">
        <input
          type="date"
          value={record.endDate}
          min={COCKPIT_TODAY}
          onChange={(e) => updateDiscountInput('H4_H5_H6_H7', item.id, 'endDate', e.target.value)}
          className="w-full text-xs font-semibold bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded text-center py-1 font-mono"
        />
      </td>
    </tr>
  );
})}
                    {/* TAB MATERIAL */}
                    {activeTab === 'Material' && paginatedRows.map(item => {
                        const record = materialDiscounts[item.id] || { discountPercent: '', endDate: '' };
                        const hasVal = record.discountPercent && parseFloat(record.discountPercent.replace(',', '.')) !== 0;
                        const isSelected = (selectedKeys.Material || new Set()).has(item.id);
                        return (
                          <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${hasVal ? 'bg-blue-50/15' : ''} ${isSelected ? 'bg-blue-100/20' : ''}`}>
                            <td className="py-2 px-3 border-r border-slate-200 text-center sticky left-0 z-10 bg-white/40 shadow-r">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleRowSelected('Material', item.id)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                              />
                            </td>
                            
                            <td className="py-2 px-4 border-r border-slate-200 font-mono text-xs font-bold text-blue-800 bg-slate-50/30 select-all">{item.id}</td>
                            <td className="py-2 px-4 border-r border-slate-200 font-semibold text-slate-800 truncate">{item.name}</td>
                            
                            
                            <td className="py-1 px-3 border-r border-slate-200 bg-amber-50/10">
                              <div className="flex items-center space-x-1 justify-center">
                                <input
                                  type="text"
                                  placeholder="0.000"
                                  value={record.discountPercent}
                                  onChange={(e) => updateDiscountInput('Material', item.id, 'discountPercent', e.target.value)}
                                  className="w-20 text-center bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded font-semibold text-slate-900 text-xs py-1"
                                />
                                <span className="text-[10px] font-bold text-amber-700">%</span>
                              </div>
                            </td>
                            <td className="py-1 px-3 border-r border-slate-200 bg-slate-55 text-slate-500 font-semibold text-center select-none font-mono">
                              {formatDateToPT(COCKPIT_TODAY)}
                            </td>
                            <td className="py-1 px-3 bg-amber-50/10">
                              <input
                                type="date"
                                value={record.endDate}
                                min={COCKPIT_TODAY}
                                onChange={(e) => updateDiscountInput('Material', item.id, 'endDate', e.target.value)}
                                className="w-full text-xs font-semibold bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded text-center py-1 font-mono"
                              />
                            </td>
                          </tr>
                        );
                      })}

                  </tbody>
                </table>
              </div>

              {/* TABLE FOOTER SUMMARY (sem paginação) */}
<div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between gap-4">
  <div className="text-xs text-slate-500 font-semibold">
    {filteredRows.length} registos filtrados
  </div>
</div>

              {/* MASS UTILITY FOOTER COCKPIT */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col space-y-4">
                
                {/* 1. PERCENTAGE propagations */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3.5 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <Grid className="w-4 h-4 text-slate-500" />
                    <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                      PROPAGAÇÃO DE DESCONTO % EM LOTE (TABELA ATIVA):
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        placeholder="Percentagem %"
                        value={bulkPctInput}
                        onChange={(e) => setBulkPctInput(e.target.value)}
                        className="w-32 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-semibold"
                      />
                      <span className="text-xs font-bold text-slate-600">%</span>
                    </div>

                    <button
                      onClick={handleApplyPctBulkValue}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded transition"
                    >
                      Aplicar Desconto a {bulkScope === 'selecionadas' ? 'Selecionadas' : 'Linhas Filtradas'}
                    </button>
                  </div>
                </div>

                {/* 2. COMPLETELY INTEGRATED BULK VALIDTO DATES ENGINE */}
                <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                      ATUALIZAÇÃO EM LOTE DA DATA FIM (ValidTo):
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* SCOPE SELECTOR */}
                    <div className="bg-white border border-slate-250 p-1 rounded-lg flex items-center space-x-1">
                      <button
                        onClick={() => setBulkScope('visiveis')}
                        className={`px-2 py-1 text-[10px] font-bold rounded transition ${bulkScope === 'visiveis' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                        title="Aplica às linhas exibidas após filtros"
                      >
                        Filtradas Visíveis ({visibleKeysForTab.length})
                      </button>
                      <button
                        onClick={() => setBulkScope('selecionadas')}
                        className={`px-2 py-1 text-[10px] font-bold rounded transition ${bulkScope === 'selecionadas' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                        title="Aplica apenas às linhas marcadas por caixas de seleção"
                      >
                        Selecionadas ({(selectedKeys[activeTab] || new Set()).size})
                      </button>
                    </div>

                    {/* SELECT OPTION SELECTOR */}
                    <select
  value={bulkValidToOption}
  onChange={(e: any) => setBulkValidToOption(e.target.value)}
  className="px-2.5 py-1.5 bg-white border border-slate-350 rounded text-xs font-semibold focus:ring-1 focus:ring-blue-500"
>
  <option value="aberto">1) Período Aberto (A data vira 31/12/9999)</option>
  <option value="fim_mes">2) Fim do Mês Corrente ({formatDateToPT(currentMonthEnd)})</option>
  <option value="fim_ano">3) Fim do Ano ({formatDateToPT(currentYearEnd)})</option>
  <option value="especifica">4) Escolher Data Específica...</option>
</select>

                    {/* Conditional date picker for Custom Specific Date */}
                    {bulkValidToOption === 'especifica' && (
                      <input
                        type="date"
                        value={bulkValidToSpecificDate}
                        min={COCKPIT_TODAY}
                        onChange={(e) => setBulkValidToSpecificDate(e.target.value)}
                        className="px-2 py-1.5 bg-white border border-amber-300 focus:border-blue-500 rounded text-xs font-mono font-semibold"
                      />
                    )}

                    <button
                      onClick={handlePrepareBulkValidTo}
                      className="px-4.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition shadow-sm"
                    >
                      Gravar Data Fim em Lote
                    </button>
                  </div>
                </div>

                {/* REAL-TIME DUST/WARNING BULK CONFIRMER BOX */}
                {bulkConfirmPreview && (
                  <div className="bg-amber-50 border border-amber-250 p-4 rounded-xl flex items-start space-x-3 text-amber-900 animate-fadeIn mt-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                    <div className="flex-1">
                      <span className="font-extrabold text-xs block uppercase tracking-wider mb-1">Confirmação de Alterações Globais de Data Fim</span>
                      <p className="text-xs">
                        Será aplicada a data final <strong className="font-mono text-slate-800 bg-amber-100 px-1 rounded">{bulkConfirmPreview.date}</strong> a um total de <strong className="font-bold">{bulkConfirmPreview.count} registos</strong> na tabela ativa [<strong>{activeTab}</strong>] ({bulkScope === 'selecionadas' ? 'caixas marcadas' : 'sobre filtros de pesquisa'}).
                      </p>
                      
                      {bulkConfirmPreview.count > 10 && (
                        <div className="mt-2 text-[10px] bg-amber-100 border border-amber-200 text-amber-800 p-2 rounded-lg font-semibold flex items-center space-x-1.5">
                          <Info className="w-3.5 h-3.5" />
                          <span>ALERTA DE SEGURANÇA: Configuração em lote superior a 10 registos ({bulkConfirmPreview.count} linhas). Confirme atentamente a integridade da cobertura.</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 mt-3.5">
                        <button
                          onClick={handleConfirmBulkValidTo}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition"
                        >
                          Sim, Aplicar em Lote
                        </button>
                        <button
                          onClick={() => setBulkConfirmPreview(null)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition"
                        >
                          Cancelar Operação
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </>
          )}

        </div>

        {/* STEP 3: MÓDULO DE VALIDAÇÕES & EXPORTER DE EXCEL SAP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          
          {/* Validations Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>Auditoria e Regras Regulamentares (VK11 Rules)</span>
              </h4>
              
              {validationAlerts.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 rounded-lg text-xs flex items-start space-x-2">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-900">Nenhum Conflito Detetado</span>
                    <span>Tudo OK para processamento. Todas as chaves mapeadas pertencem à sua dimensão exata do catálogo e as datas de cobertura são compatíveis. O download está liberado.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {validationAlerts.map((alert, i) => (
                    <div 
                      key={i} 
                      className={`text-xs p-2.5 rounded border-l-3 flex items-start space-x-2 ${
                        alert.type === 'ERROR' 
                          ? 'bg-rose-50 border-rose-500 text-rose-800' 
                          : 'bg-amber-50 border-amber-500 text-amber-800'
                      }`}
                    >
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.type === 'ERROR' ? 'text-rose-600' : 'text-amber-500'}`} />
                      <div>
                        <span className="font-mono bg-white px-1.5 py-0.2 rounded text-[9px] border border-slate-200 text-slate-500 mr-2 font-bold select-none">
                          {alert.code}
                        </span>
                        <span className="leading-relaxed">{alert.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 mt-4 pt-3 border-t border-slate-100 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>Qualquer mistura de códigos dimensionais incorretos do Catálogo (ex: usar H7_code em campo H4) é rigidamente classificada como ERRO BLOQUEANTE.</span>
            </div>
          </div>

          {/* Export and Actions Area */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-amber-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                  SAP VK11 LOADER
                </span>
                <span className="text-xs text-slate-400 font-mono">Formato Excel (.xlsx)</span>
              </div>

              <h4 className="text-base font-bold text-white tracking-tight">Gerar Ficheiro Excel SAP VK11</h4>
              <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                Gera de forma automática abas no Excel para as dimensões configuradas. O arquivo é montado sem metadados inválidos do SAP (Condições, Organizações de Venda, Divisões), que devem ser inseridos livremente na interface do utilitário VK11.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4 text-[10px] font-mono bg-slate-850 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Ficheiro SAP Destino:</span>
                  <span className="text-slate-300 font-semibold text-[10.5px] truncate block">
                    SAP_VK11_Descontos_{targetCode || '...'}.xlsx
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Chaves Ativadas:</span>
                  <span className="text-amber-400 font-extrabold block">{totalFilled} registos</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col space-y-2">
              <button
                disabled={hasCriticalError || totalFilled === 0}
                onClick={handleExportSAPExcel}
                className={`w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-lg text-xs font-extrabold shadow-md transition ${
                  hasCriticalError || totalFilled === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 font-bold'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-98 cursor-pointer'
                }`}
              >
                <Download className="w-4.5 h-4.5" />
                <span>GERAR EXCEL FINAL DE CARREGAMENTO ({totalFilled} REGISTOS)</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
