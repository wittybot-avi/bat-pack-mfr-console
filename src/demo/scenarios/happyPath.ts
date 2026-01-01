
export const seedHappyPath = () => {
  const now = new Date().toISOString();
  
  const skus = [{
    id: 'sku-happy',
    skuCode: 'VV360-LFP-HAPPY',
    skuName: 'Vanguard Happy Path',
    version: '1.0.0',
    chemistry: 'LFP',
    formFactor: 'Prismatic',
    seriesCount: 16,
    parallelCount: 1,
    nominalVoltage: 48,
    capacityAh: 100,
    requiredModules: 1,
    status: 'ACTIVE',
    rules: { minCells: 16, maxCells: 16, allowedChemistry: ['LFP'], requiredScans: ['CELL_SERIAL'] },
    createdAt: now,
    updatedAt: now
  }];

  const lots = [{
    id: 'lot-happy',
    lotCode: 'CATL-HAPPY-PATH',
    supplierName: 'CATL',
    supplierLotNo: 'SL-HAPPY-001',
    chemistry: 'LFP',
    formFactor: 'Prismatic',
    capacityAh: 100,
    receivedDate: '2024-05-01',
    quantityReceived: 100,
    status: 'READY_TO_BIND',
    generatedCount: 16,
    scannedCount: 16,
    boundCount: 16,
    createdAt: now,
    updatedAt: now
  }];

  const serials = Array.from({ length: 16 }).map((_, i) => ({
    serial: `SN-HAPPY-${String(i + 1).padStart(3, '0')}`,
    lotId: 'lot-happy',
    status: 'BOUND',
    generatedAt: now,
    scannedAt: now,
    actor: 'System Seeder'
  }));

  const bindings = serials.map(s => ({
    moduleId: 'MOD-HAPPY-01',
    serial: s.serial,
    lotId: 'lot-happy',
    lotCode: 'CATL-HAPPY-PATH',
    boundAt: now,
    actor: 'System Seeder',
    chemistry: 'LFP'
  }));

  const modules = [{
    id: 'MOD-HAPPY-01',
    skuId: 'sku-happy',
    skuCode: 'VV360-LFP-HAPPY',
    targetCells: 16,
    boundCellSerials: serials.map(s => s.serial),
    status: 'SEALED',
    createdBy: 'System Seeder',
    createdAt: now,
    updatedAt: now
  }];

  const packs = [{
    id: 'PACK-HAPPY-01',
    skuId: 'sku-happy',
    skuCode: 'VV360-LFP-HAPPY',
    requiredModules: 1,
    moduleIds: ['MOD-HAPPY-01'],
    status: 'FINALIZED',
    packSerial: 'SN-PACK-HAPPY-999',
    qcStatus: 'PASSED',
    createdBy: 'System Seeder',
    createdAt: now,
    updatedAt: now
  }];

  const testRuns = [{
    id: 'TR-HAPPY',
    packId: 'PACK-HAPPY-01',
    startedAt: now,
    completedAt: now,
    actor: 'QA Expert',
    items: [],
    computedResult: 'PASS',
    finalDecision: 'PASS'
  }];

  localStorage.setItem('aayatana_skus_v1', JSON.stringify(skus));
  localStorage.setItem('aayatana_cell_lots_v1', JSON.stringify(lots));
  localStorage.setItem('aayatana_cell_serials_v1_lot-happy', JSON.stringify(serials));
  localStorage.setItem('aayatana_cell_bindings_v1', JSON.stringify(bindings));
  localStorage.setItem('aayatana_modules_v1', JSON.stringify(modules));
  localStorage.setItem('aayatana_packs_v1', JSON.stringify(packs));
  localStorage.setItem('aayatana_eol_test_runs_v1', JSON.stringify(testRuns));
};
