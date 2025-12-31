
import { skuService } from './skuService';
import { cellTraceabilityService } from './cellTraceabilityService';
import { moduleAssemblyService } from './moduleAssemblyService';
import { packAssemblyService } from './packAssemblyService';

export interface SearchResolution {
    route: string;
    type: 'CELL' | 'MODULE' | 'PACK' | 'SKU' | 'LOT';
    id: string;
    label: string;
}

class TraceSearchService {
    async resolveIdentifier(query: string): Promise<SearchResolution | null> {
        const q = query.trim();
        if (!q) return null;

        // 1. Check SKU (usually starts with blueprint prefixes or matches code)
        const skus = await skuService.listSkus();
        const foundSku = skus.find(s => s.skuCode.toLowerCase() === q.toLowerCase() || s.id === q);
        if (foundSku) {
            return { route: `/sku/${foundSku.id}`, type: 'SKU', id: foundSku.id, label: foundSku.skuCode };
        }

        // 2. Check Pack (Starts with PB- or matches Serial SN-)
        const packs = await packAssemblyService.listPacks();
        const foundPack = packs.find(p => p.id.toLowerCase() === q.toLowerCase() || (p.packSerial && p.packSerial.toLowerCase() === q.toLowerCase()));
        if (foundPack) {
            return { route: `/operate/packs/${foundPack.id}`, type: 'PACK', id: foundPack.id, label: foundPack.packSerial || foundPack.id };
        }

        // 3. Check Module (Starts with MOD-)
        const modules = await moduleAssemblyService.listModules();
        const foundMod = modules.find(m => m.id.toLowerCase() === q.toLowerCase());
        if (foundMod) {
            return { route: `/operate/modules/${foundMod.id}`, type: 'MODULE', id: foundMod.id, label: foundMod.id };
        }

        // 4. Check Lot (Starts with clot- or matches Lot Code)
        const lots = await cellTraceabilityService.listLots();
        const foundLot = lots.find(l => l.id.toLowerCase() === q.toLowerCase() || l.lotCode.toLowerCase() === q.toLowerCase());
        if (foundLot) {
            return { route: `/trace/cells/${foundLot.id}`, type: 'LOT', id: foundLot.id, label: foundLot.lotCode };
        }

        // 5. Check Cell Serial (Global Lookup)
        const cellLookup = await cellTraceabilityService.findSerialGlobal(q);
        if (cellLookup) {
            // If found a cell, we usually want to jump to its lineage
            return { route: `/trace/lineage/${cellLookup.serial.serial}`, type: 'CELL', id: cellLookup.serial.serial, label: cellLookup.serial.serial };
        }

        return null;
    }
}

export const traceSearchService = new TraceSearchService();
