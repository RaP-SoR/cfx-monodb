-- Optional copy-paste helpers for docs/examples/lua/queries.md §3.9
-- Not loaded by cfx-mongodb — drop into your resource if useful.
-- Store UTC in Mongo; use offsets below for “start of local day” filters only.

local DatetimeHelpers = {}

-- Fixed offsets (seconds east of UTC). Winter examples — adjust for DST.
DatetimeHelpers.OFFSET_EU_CET = 3600
DatetimeHelpers.OFFSET_EU_CEST = 7200
DatetimeHelpers.OFFSET_UK_GMT = 0
DatetimeHelpers.OFFSET_UK_BST = 3600
DatetimeHelpers.OFFSET_US_EAST_EST = -18000
DatetimeHelpers.OFFSET_US_EAST_EDT = -14400
DatetimeHelpers.OFFSET_US_WEST_PST = -28800
DatetimeHelpers.OFFSET_US_WEST_PDT = -25200
DatetimeHelpers.OFFSET_ASIA_TOKYO = 32400
DatetimeHelpers.OFFSET_ASIA_SHANGHAI = 28800
DatetimeHelpers.OFFSET_ASIA_DUBAI = 14400
DatetimeHelpers.OFFSET_ASIA_INDIA = 19800

function DatetimeHelpers.isoUtcNow()
  return os.date('!%Y-%m-%dT%H:%M:%SZ')
end

function DatetimeHelpers.isoUtcFromEpoch(epoch)
  return os.date('!%Y-%m-%dT%H:%M:%SZ', epoch)
end

--- Start of current calendar day in a fixed offset, as UTC ISO for Mongo $gte.
function DatetimeHelpers.startOfLocalDayUtcIso(offsetSeconds)
  local now = os.time()
  local localNow = now + offsetSeconds
  local startLocal = localNow - (localNow % 86400)
  return os.date('!%Y-%m-%dT%H:%M:%SZ', startLocal - offsetSeconds)
end

function DatetimeHelpers.sinceHoursAgoUtc(hours)
  return os.date('!%Y-%m-%dT%H:%M:%SZ', os.time() - (hours * 3600))
end

return DatetimeHelpers
