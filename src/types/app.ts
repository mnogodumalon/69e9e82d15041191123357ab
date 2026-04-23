// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface FionaExportZuKml {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zip_datei?: string;
    kml_name?: string;
    beschreibung?: string;
    koordinatensystem?: LookupValue;
    koordinatensystem_sonstiges?: string;
    ebenen?: string;
    geometrietyp?: LookupValue[];
    attribute_exportieren?: boolean;
    anmerkungen?: string;
  };
}

export const APP_IDS = {
  FIONA_EXPORT_ZU_KML: '69e9e816ac7299aacb189823',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'fiona_export_zu_kml': {
    koordinatensystem: [{ key: "wgs84", label: "WGS 84 (EPSG:4326)" }, { key: "lv95", label: "CH1903+ / LV95 (EPSG:2056)" }, { key: "lv03", label: "CH1903 / LV03 (EPSG:21781)" }, { key: "utm32n", label: "UTM Zone 32N (EPSG:32632)" }, { key: "sonstiges", label: "Sonstiges" }],
    geometrietyp: [{ key: "punkte", label: "Punkte" }, { key: "linien", label: "Linien" }, { key: "flaechen", label: "Flaechen" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'fiona_export_zu_kml': {
    'zip_datei': 'file',
    'kml_name': 'string/text',
    'beschreibung': 'string/textarea',
    'koordinatensystem': 'lookup/select',
    'koordinatensystem_sonstiges': 'string/text',
    'ebenen': 'string/text',
    'geometrietyp': 'multiplelookup/checkbox',
    'attribute_exportieren': 'bool',
    'anmerkungen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateFionaExportZuKml = StripLookup<FionaExportZuKml['fields']>;