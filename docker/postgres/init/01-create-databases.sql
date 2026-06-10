-- Cria um banco isolado por microsserviço (nenhum compartilhamento direto de DB).
-- Executado automaticamente pelo postgres no primeiro boot do volume.

SELECT 'CREATE DATABASE ligeirinho_identity'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'ligeirinho_identity'
)\gexec

SELECT 'CREATE DATABASE ligeirinho_catalog'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'ligeirinho_catalog'
)\gexec

SELECT 'CREATE DATABASE ligeirinho_orders'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'ligeirinho_orders'
)\gexec
