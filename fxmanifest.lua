fx_version 'cerulean'
game  {'rdr3' , 'gta5' }
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'

author 'RaPSoR'
description 'MongoDB Typescript Wrapper for CFX'
version '1.0.1'

server_script 'dist/index.js'

server_only 'yes'

convar_category 'MongoDB' {
  'Konfiguration für MongoDB-Verbindung',
  {
    { "mongodb_env", "dev", "Umgebung (dev, prod, test)", "CV_STRING" },
    { "mongodb_dev_url", "mongodb://localhost:27017/ctf_dev", "MongoDB-Verbindungsstring für Entwicklung", "CV_STRING" },
    { "mongodb_prod_url", "mongodb://localhost:27017/ctf_prod", "MongoDB-Verbindungsstring für Produktion", "CV_STRING" },
    { "mongodb_test_url", "mongodb://localhost:27017/ctf_test", "MongoDB-Verbindungsstring für Tests", "CV_STRING" },
    { "mongodb_timeout", "5000", "Timeout für MongoDB-Verbindung in Millisekunden", "CV_STRING" },
    { "mongodb_perf_enabled", "0", "Slow-query-Timing aktivieren (0=aus, 1=an)", "CV_STRING" },
    { "mongodb_perf_slow_ms", "100", "Schwellwert für Slow-Query-Warnung in ms", "CV_STRING" },
    { "mongodb_perf_log_all", "0", "Alle Queries bei debug loggen (Staging)", "CV_STRING" },
    { "mongodb_perf_buffer", "100", "Ring-Buffer für getQueryStats (max 1000)", "CV_STRING" }
  }
}

server_exports {
  'connect',
  'disconnect',
  'isConnected',
  'getDb',
  'findById',
  'findAll',
  'find',
  'insert',
  'update',
  'delete',
  'count',
  'getVersion',
  'ensureIndexes',
  'health',
  'config',
  'getQueryStats'
}

node_version '22'