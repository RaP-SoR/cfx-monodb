fx_version 'adamant'
game 'rdr3'
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'

author 'RaPSoR'
description 'Typescript Wrapper for RedM'
version '1.0.0'

server_script 'dist/index.js'

server_only 'yes'

convar_category 'MongoDB' {
  'Konfiguration für MongoDB-Verbindung',
  {
    { "mongodb_env", "dev", "Umgebung (dev, prod, test)", "CV_STRING" },
    { "mongodb_dev_url", "mongodb://localhost:27017/redm_dev", "MongoDB-Verbindungsstring für Entwicklung", "CV_STRING" },
    { "mongodb_prod_url", "mongodb://localhost:27017/redm_prod", "MongoDB-Verbindungsstring für Produktion", "CV_STRING" },
    { "mongodb_test_url", "mongodb://localhost:27017/redm_test", "MongoDB-Verbindungsstring für Tests", "CV_STRING" },
    { "mongodb_timeout", "5000", "Timeout für MongoDB-Verbindung in Millisekunden", "CV_STRING" }
  }
}

server_exports {
  'connect',
  'disconnect',
  'isConnected',
  'getDb',
  'findById',
  'find',
  'findOne',
  'insertOne',
  'updateOne',
  'deleteOne',
  'testex'
}