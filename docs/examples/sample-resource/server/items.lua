-- Flow E: push/pull items on embedded character.inventory.
-- docs/examples/lua/use-cases.md § Flow E

function SampleGiveItem(characterId, itemName, count)
  SampleWaitMongo()
  return exports['cfx-mongodb']:update('characters', { _id = characterId }, {
    ['$push'] = {
      inventory = {
        name = itemName,
        count = count,
        acquiredAt = os.time(),
      },
    },
  })
end

function SampleGetItemDef(itemName)
  SampleWaitMongo()
  return exports['cfx-mongodb']:find('item_defs', { name = itemName })
end
