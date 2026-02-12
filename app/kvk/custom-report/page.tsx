"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Settings, Filter, Download, Plus, X, ChevronDown, 
  Trash2, Edit2, Mail, CheckSquare, Square, 
  ArrowUpDown, Info, FileText, Sprout, Tractor, Droplets, Printer
} from 'lucide-react';
import { fetchFieldsData } from '@/lib/api';

// --- Types ---
interface FieldData {
  id: string;

  farmer_name: string;
  farm_name: string;
  crop_name: string;
  area: string;

  ndvi: number;
  ndmi: number;
  savi: number;
  evi: number;
  ndwi: number;
  ndre: number;
}


interface ColumnDef {
  id: string;
  label: string;
  category: 'General' | 'Satellite' | 'Weather';
}

interface Template {
  id: string;
  name: string;
  columns: string[];
}

// --- MOCK DATA ---
const ALL_COLUMNS: ColumnDef[] = [
  { id: 'farmer_name', label: 'Farmer Name', category: 'General' },
  { id: 'farm_name', label: 'Field Name', category: 'General' },
  { id: 'crop_name', label: 'Crop', category: 'General' },
  { id: 'area_ha', label: 'Area', category: 'General' },

  { id: 'ndvi', label: 'NDVI', category: 'Satellite' },
  { id: 'ndmi', label: 'NDMI', category: 'Satellite' },
  { id: 'savi', label: 'SAVI', category: 'Satellite' },
  { id: 'evi', label: 'EVI', category: 'Satellite' },
  { id: 'ndwi', label: 'NDWI', category: 'Satellite' },
  { id: 'ndre', label: 'NDRE', category: 'Satellite' }

//   { id: 'temperature', label: 'Temperature (°C)', category: 'Weather' },
//   { id: 'rainfall', label: 'Rainfall (mm)', category: 'Weather' },
];



const AgriReport: React.FC = () => {
  const [data, setData] = useState<FieldData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize] = useState(20);

  // --- STATE ---
  const [activeColumns, setActiveColumns] = useState<string[]>([
  'farmer_name',
  'farm_name',
  'crop_name',
  'ndvi',
  'ndmi'
]);

  // UI States
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showFilters, setShowFilters] = useState(false); 
  const [showExportMenu, setShowExportMenu] = useState(false); // New export menu state
  
  // Filters
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});

  // Templates
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);


  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [tempSelectedColumns, setTempSelectedColumns] = useState<string[]>(activeColumns);

  // --- ACTIONS ---

  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setData([]);
        setCurrentPage(1);
        const searchFilters = Object.keys(columnSearch).reduce((acc, key) => {
          if (columnSearch[key]) {
            acc[key] = columnSearch[key];
          }
          return acc;
        }, {} as Record<string, string>);
        
        const res = await fetchFieldsData(
          activeColumns.join(','), 
          1, 
          pageSize, 
          sortConfig?.key, 
          sortConfig?.direction === 'asc' ? 'ASC' : 'DESC',
          Object.keys(searchFilters).length > 0 ? searchFilters : undefined
        );
        setData(res.data.fields || []);
        setHasMore(res.data.pagination.currentPage < res.data.pagination.totalPages);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activeColumns, sortConfig, columnSearch]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const searchFilters = Object.keys(columnSearch).reduce((acc, key) => {
        if (columnSearch[key]) {
          acc[key] = columnSearch[key];
        }
        return acc;
      }, {} as Record<string, string>);
      
      const res = await fetchFieldsData(
        activeColumns.join(','), 
        nextPage, 
        pageSize, 
        sortConfig?.key, 
        sortConfig?.direction === 'asc' ? 'ASC' : 'DESC',
        Object.keys(searchFilters).length > 0 ? searchFilters : undefined
      );
      const newData = res.data.fields || [];
      setData(prev => [...prev, ...newData]);
      setCurrentPage(nextPage);
      setHasMore(res.data.pagination.currentPage < res.data.pagination.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  // 1. DYNAMIC DATA PROCESSING
  const processedData = useMemo(() => {
    return [...data];
  }, [data]);

  // 2. EXPORT LOGIC
  const handleDownloadCSV = () => {
    const headers = activeColumns.map(colId => ALL_COLUMNS.find(c => c.id === colId)?.label || colId);
    
    const getVal = (row: FieldData, colId: string) => {
  return (row as any)[colId] ?? '';
};


    const csvRows = [
      headers.join(','), 
      ...processedData.map(row => activeColumns.map(col => `"${getVal(row, col)}"`).join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Agri-Report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    // Use window.print(). The CSS @media print (using Tailwind 'print:' prefix) handles the layout.
    // Modern browsers allow "Save as PDF" from the print dialog.
    window.print();
  };

  // 3. Sorting
  const handleSort = (colId: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === colId && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: colId, direction });
  };

  // 4. Template Logic
  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const applyTemplate = (t: Template) => {
    setActiveColumns(t.columns);
    setActiveTemplateId(t.id);
    setShowTemplateModal(false);
  };


  // --- RENDERERS ---

  const renderCell = (row: FieldData, colId: string) => {
  const value = row[colId as keyof FieldData];

  if (typeof value === 'number') {
    return (
      <span className="font-mono font-semibold text-slate-700">
        {value.toFixed(2)}
      </span>
    );
  }

  return <span className="text-slate-700">{value ?? '--'}</span>;
};
  return (
    // MAIN CONTAINER - Theme: Standard Agriculture (Light & Clean)
    <div className="w-full min-h-screen h-full bg-slate-50 text-slate-800 font-sans text-sm flex flex-col relative print:bg-white" ref={wrapperRef}>
      
      {/* 1. HEADER BAR */}
      <div className="flex flex-wrap justify-between items-center px-6 py-4 border-b border-emerald-200 bg-green-600 shadow-sm gap-4 print:border-none print:shadow-none print:px-0">
        <div className="flex items-center gap-3">
           <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-md shadow-emerald-200">
             <Tractor size={20} />
           </div>
           <div>
               <h1 className="text-xl font-bold text-white tracking-tight">KVK Custom-Report</h1>
               <div className="text-[11px] text-white uppercase tracking-wider font-bold">Farm Monitoring Dashboard</div>
           </div>
        </div>

        {/* CONTROLS - Hidden when printing */}
        <div className="flex items-center gap-2 md:gap-3 print:hidden">
            <button 
                onClick={() => setShowSummary(!showSummary)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors border ${showSummary ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
                ✦ Summary
            </button>
            
            <button 
                onClick={() => setShowTemplateModal(true)}
                className="h-full bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md flex items-center gap-2 border border-slate-200 shadow-sm"
            >
                <Settings size={16} /> Templates
            </button>

            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-md border transition-all shadow-sm ${showFilters ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                title="Toggle Column Filters"
            >
                <Filter size={18} />
            </button>

            {/* EXPORT DROPDOWN (PDF/PRINT/CSV) */}
            <div className="relative">
                <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md flex items-center gap-2 font-semibold shadow-md shadow-emerald-200 transition-all active:scale-95"
                >
                    <Download size={18} />
                    <span className="hidden md:inline">Export</span>
                    <ChevronDown size={14} />
                </button>
                
                {showExportMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                        <button 
                            onClick={handleDownloadCSV}
                            className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                        >
                            <FileText size={16} className="text-emerald-600"/> Download CSV
                        </button>
                        <button 
                            onClick={handlePrint}
                            className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Printer size={16} className="text-emerald-600"/> Print / Save PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* SUMMARY PANEL */}
      {showSummary && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 animate-in fade-in slide-in-from-top-2 print:hidden">
            <h3 className="text-emerald-800 font-bold mb-2 flex items-center gap-2"><Droplets size={16}/> Irrigation Insights</h3>
            <p className="text-emerald-900 text-sm leading-relaxed max-w-4xl"> 
                Moisture index (NDMI) suggests irrigation required for <strong>Plot A-12</strong> within 48 hours.
            </p>
        </div>
      )}

      {/* 3. TABLE AREA */}
      <div 
        className="flex-1 w-full overflow-auto custom-scrollbar bg-slate-50 relative z-10 print:overflow-visible print:bg-white"
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          if (hasMore && !loadingMore) {
            loadMore();
          }
        }}
      >
        <table className="w-full text-left border-collapse min-w-[900px] print:min-w-0">
            <thead className="sticky top-0 bg-emerald-50 z-20 shadow-sm print:static print:bg-white print:border-b-2 print:border-slate-800">
                <tr className="border-b border-emerald-200 text-xs uppercase tracking-wide text-emerald-800 font-bold">
                    {ALL_COLUMNS.filter(col => activeColumns.includes(col.id)).map(col => (
                        <th 
                            key={col.id} 
                            onClick={() => handleSort(col.id)}
                            className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-emerald-100/50 transition-colors group print:px-2 print:py-2 print:text-black"
                        >
                            <div className="flex items-center gap-2">
                                {col.label}
                                <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 text-emerald-500 ${sortConfig?.key === col.id ? 'opacity-100' : ''}`} />
                            </div>
                        </th>
                    ))}
                </tr>
                {/* IN-TABLE FILTER ROW (Hidden on Print) */}
                {showFilters && (
                    <tr className="bg-white border-b border-slate-200 print:hidden">
                        {ALL_COLUMNS.filter(col => activeColumns.includes(col.id)).map(col => (
                            <td key={`filter-${col.id}`} className="px-2 py-2 bg-slate-50">
                                <input 
                                    type="text" 
                                    placeholder={`Find...`}
                                    value={columnSearch[col.id] || ''}
                                    onChange={(e) => setColumnSearch({...columnSearch, [col.id]: e.target.value})}
                                    className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-2 py-1.5 rounded focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </td>
                        ))}
                    </tr>
                )}
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
                {processedData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors group print:hover:bg-transparent">
                         {ALL_COLUMNS.filter(col => activeColumns.includes(col.id)).map(col => (
                            <td key={col.id} className="px-6 py-3 whitespace-nowrap print:px-2 print:py-2 print:text-xs">
                                {renderCell(row, col.id)}
                            </td>
                         ))}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- MODAL 1: TEMPLATE SELECTOR (Hidden on Print) --- */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={20} className="text-emerald-600"/> Saved Reports
                    </h2>
                    <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-800"><X size={20}/></button>
                </div>
                <div className="p-6">
                    <button 
                        onClick={() => { setShowTemplateModal(false); setShowCreateModal(true); setTempSelectedColumns(activeColumns); }}
                        className="w-full py-3 mb-6 border-2 border-dashed border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <Plus size={18} /> Design New Template
                    </button>
                    
                    <div className="space-y-3">
                        {templates.map(t => (
                             <div key={t.id} className={`border rounded-lg p-3 flex justify-between items-center transition-all ${activeTemplateId === t.id ? 'bg-emerald-50 border-emerald-400 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => applyTemplate(t)}>
                                    <div className={`w-4 h-4 rounded-full border-4 ${activeTemplateId === t.id ? 'border-emerald-500' : 'border-slate-300'} bg-transparent`}></div>
                                    <span className={activeTemplateId === t.id ? "text-emerald-900 font-bold" : "text-slate-600"}>{t.name}</span>
                                </div>
                                <div className="flex gap-3 text-slate-400">
                                    <Edit2 
                                        size={16} 
                                        className="hover:text-blue-500 cursor-pointer"
                                        onClick={() => { 
                                            setShowTemplateModal(false); 
                                            setShowCreateModal(true); 
                                            setTempSelectedColumns(t.columns); 
                                        }} 
                                    />
                                    <Trash2 size={16} className="hover:text-red-500 cursor-pointer" onClick={() => deleteTemplate(t.id)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                    <button onClick={() => setShowTemplateModal(false)} className="w-full bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold py-3 rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 2: COLUMN PICKER (Hidden on Print) --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
             <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <div className="text-center w-full">
                        <h2 className="text-lg font-bold text-slate-800">Customize Columns</h2>
                    </div>
                    <button onClick={() => setShowCreateModal(false)} className="absolute right-4 text-slate-400 hover:text-slate-800"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        {ALL_COLUMNS.map((col) => {
                             const isSelected = tempSelectedColumns.includes(col.id);
                             return (
                                <div 
                                    key={col.id} 
                                    onClick={() => {
                                        if (isSelected) setTempSelectedColumns(prev => prev.filter(c => c !== col.id));
                                        else setTempSelectedColumns(prev => [...prev, col.id]);
                                    }}
                                    className={`flex justify-between items-center p-3 rounded-lg cursor-pointer border transition-all ${isSelected ? 'bg-emerald-50 border-emerald-400' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={isSelected ? "text-emerald-800 font-bold" : "text-slate-600"}>{col.label}</span>
                                    </div>
                                    <div className={isSelected ? "text-emerald-600" : "text-slate-300"}>
                                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-4 rounded-b-xl">
                    <button onClick={() => setShowCreateModal(false)} className="flex-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 font-bold py-3 rounded-lg">Cancel</button>
                    <button onClick={() => { setActiveColumns(tempSelectedColumns); setShowCreateModal(false); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-md shadow-emerald-200">
                        Apply
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default AgriReport;