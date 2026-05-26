fx_version 'cerulean'
game { 'gta5', 'rdr3' }

name 'cfx-mongodb-sample'
description 'Reference consumer — accounts, characters, vehicles (see docs/examples/sample-resource/)'
author 'cfx-mongodb docs'
version '0.1.0'

dependency 'cfx-mongodb'

server_scripts {
  'server/main.lua',
  'server/accounts.lua',
  'server/characters.lua',
  'server/vehicles.lua',
  'server/items.lua',
}
