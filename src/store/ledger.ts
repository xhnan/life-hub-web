import { reactive } from 'vue';
import { getLedgerListApi, type LedgerRow } from '@/api/fin/ledger';
import { STORAGE_KEYS } from '@/utils/constants';

interface LedgerState {
  currentLedgerId: number | null;
  ledgerList: LedgerRow[];
  loading: boolean;
}

export const ledgerStore = reactive<LedgerState>({
  currentLedgerId: null,
  ledgerList: [],
  loading: false
});

export const loadLedgers = async () => {
  ledgerStore.loading = true;
  try {
    const res = await getLedgerListApi();
    if (res.data) {
      ledgerStore.ledgerList = res.data;
      
      // 如果没有选中账本，且有账本数据，默认选中第一个
      if (!ledgerStore.currentLedgerId && ledgerStore.ledgerList.length > 0) {
        const defaultLedger = ledgerStore.ledgerList[0];
        if (defaultLedger && defaultLedger.id) {
          setLedger(defaultLedger.id);
        }
      }
    }
  } catch (error) {
    console.error('Failed to load ledgers', error);
  } finally {
    ledgerStore.loading = false;
  }
};

export const setLedger = (id: number) => {
  ledgerStore.currentLedgerId = id;
  localStorage.setItem('life_hub_current_ledger', String(id));
};

export const initLedgerStore = () => {
  const storedId = localStorage.getItem('life_hub_current_ledger');
  if (storedId) {
    ledgerStore.currentLedgerId = Number(storedId);
  }
  loadLedgers();
};
