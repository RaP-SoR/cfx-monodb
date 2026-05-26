fx_version 'cerulean'
game { 'gta5', 'rdr3' }

name 'cfx-mongodb-example-ts'
author 'YourName'
version '0.0.1'

dependency 'cfx-mongodb'

-- server.cfg: ensure cfx-mongodb before this resource

-- Build docs/examples/typescript/server.ts to dist/example.js and reference here
server_scripts {
  'dist/example.js'
}
