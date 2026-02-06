import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CachedData {
  data: unknown;
  timestamp: number;
  ttl: number;
}

const CACHE_PREFIX = 'elolab_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

export function useOfflineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; enabled?: boolean }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<Error | null>(null);

  const cacheKey = `${CACHE_PREFIX}${key}`;
  const ttl = options?.ttl ?? DEFAULT_TTL;
  const enabled = options?.enabled ?? true;

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ler do cache
  const readFromCache = useCallback((): T | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp, ttl: cachedTtl }: CachedData = JSON.parse(cached);
      
      // Verificar se o cache expirou
      if (Date.now() - timestamp > cachedTtl) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return data as T;
    } catch {
      return null;
    }
  }, [cacheKey]);

  // Escrever no cache
  const writeToCache = useCallback((data: T) => {
    try {
      const cacheData: CachedData = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Erro ao salvar no cache:', error);
    }
  }, [cacheKey, ttl]);

  // Buscar dados
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Se offline, tentar usar cache
      if (isOffline) {
        const cachedData = readFromCache();
        if (cachedData) {
          setData(cachedData);
        } else {
          throw new Error('Sem conexão e sem dados em cache');
        }
      } else {
        // Online: buscar dados novos
        const freshData = await fetcher();
        setData(freshData);
        writeToCache(freshData);
      }
    } catch (err) {
      setError(err as Error);
      
      // Tentar cache como fallback
      const cachedData = readFromCache();
      if (cachedData) {
        setData(cachedData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isOffline, fetcher, readFromCache, writeToCache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch manual
  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Limpar cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
  }, [cacheKey]);

  return {
    data,
    isLoading,
    isOffline,
    error,
    refetch,
    clearCache,
  };
}

// Cache de dados críticos para modo offline
export function useCriticalDataCache() {
  const [isCaching, setIsCaching] = useState(false);

  const cacheAgendamentosHoje = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('agendamentos')
      .select('*, pacientes(nome, telefone), medicos(crm)')
      .eq('data', hoje);
    
    if (data) {
      localStorage.setItem(`${CACHE_PREFIX}agendamentos_hoje`, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl: 60 * 60 * 1000, // 1 hora
      }));
    }
  };

  const cachePacientesRecentes = async () => {
    const { data } = await supabase
      .from('pacientes')
      .select('id, nome, telefone, cpf, data_nascimento, alergias')
      .order('updated_at', { ascending: false })
      .limit(100);
    
    if (data) {
      localStorage.setItem(`${CACHE_PREFIX}pacientes_recentes`, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl: 30 * 60 * 1000, // 30 minutos
      }));
    }
  };

  const cacheMedicos = async () => {
    const { data } = await supabase
      .from('medicos')
      .select('*')
      .eq('ativo', true);
    
    if (data) {
      localStorage.setItem(`${CACHE_PREFIX}medicos`, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl: 60 * 60 * 1000, // 1 hora
      }));
    }
  };

  const cacheAll = async () => {
    if (!navigator.onLine) return;
    
    setIsCaching(true);
    try {
      await Promise.all([
        cacheAgendamentosHoje(),
        cachePacientesRecentes(),
        cacheMedicos(),
      ]);
      console.log('Dados críticos em cache atualizados');
    } catch (error) {
      console.error('Erro ao cachear dados:', error);
    } finally {
      setIsCaching(false);
    }
  };

  const getCachedData = (key: string) => {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;
      
      const { data, timestamp, ttl }: CachedData = JSON.parse(cached);
      if (Date.now() - timestamp > ttl) return null;
      
      return data;
    } catch {
      return null;
    }
  };

  return {
    isCaching,
    cacheAll,
    getCachedData,
    cacheAgendamentosHoje,
    cachePacientesRecentes,
    cacheMedicos,
  };
}
