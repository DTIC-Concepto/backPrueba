#!/bin/bash
set -e

# Script de inicialización de la base de datos PostgreSQL
# Este script se ejecuta automáticamente cuando se crea el contenedor por primera vez

echo "🚀 Iniciando configuración de base de datos Poliacredita..."

# Crear extensiones útiles
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Crear extensiones útiles
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    
    -- Crear schema para la aplicación si no existe
    CREATE SCHEMA IF NOT EXISTS poliacredita;
    
    -- Configurar permisos
    GRANT ALL PRIVILEGES ON SCHEMA poliacredita TO $POSTGRES_USER;
    
    -- Configurar timezone
    SET timezone = 'America/Bogota';
EOSQL

echo "✅ Base de datos configurada exitosamente"
