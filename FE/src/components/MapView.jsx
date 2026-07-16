import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const OSM = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
}

const vworldTile = (key) => ({
  url: `https://api.vworld.kr/req/wmts/1.0.0/${key}/Base/{z}/{y}/{x}.png`,
  attribution: '&copy; VWorld',
})

// 검색 중심(내 위치) 마커
const centerIcon = L.divIcon({
  className: 'mk',
  html: '<div class="mk-center"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// 일반 후보/밀린 곳 점 — 시각은 11px, 터치 영역은 26px(모바일 터치 타겟 확보)
const dotIcon = (selected, dimmed) =>
  L.divIcon({
    className: 'mk',
    html: `<div class="mk-hit${dimmed ? ' dim' : ''}"><div class="mk-dot${selected ? ' sel' : ''}"></div></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })

// top3 순위 핀 — 선택 시 확대, 다른 곳 선택 시 흐림(지도 조작에는 영향 없음)
const rankIcon = (rank, selected, dimmed) =>
  L.divIcon({
    className: 'mk',
    html: `<div class="mk-pin rank-${rank}${selected ? ' sel' : ''}${dimmed ? ' dim' : ''}"><span>${rank}</span></div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
  })

// 검색 중심이 바뀌면 이동. center.zoom 이 있으면 그 줌으로(예: 장소검색 시 확대), 없으면 현재 줌 유지.
function Recenter({ center }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], center.zoom ?? map.getZoom())
  }, [center.lat, center.lng, center.zoom]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// 후보가 새로 들어오면 전체가 보이도록 화면 맞춤
function FitToPlaces({ places, center }) {
  const map = useMap()
  useEffect(() => {
    const pts = places.filter((p) => p.lat != null).map((p) => [p.lat, p.lng])
    if (pts.length === 0) return
    pts.push([center.lat, center.lng])
    map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 16 })
  }, [places]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// 마커를 선택하면 지도를 그 지점으로 부드럽게 팬 — 줌은 건드리지 않아 탐색 흐름을 방해하지 않는다
function PanToSelected({ places, selectedId }) {
  const map = useMap()
  useEffect(() => {
    if (selectedId == null) return
    const p = places.find((x) => x.restaurantId === selectedId)
    if (p?.lat != null) {
      map.panTo([p.lat, p.lng], { animate: true, duration: 0.5 })
    }
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// 지도 빈 곳 클릭: 검색 화면에선 위치 조정(onPick), 결과 화면에선 선택 해제(onBlankTap)
function ClickToPick({ onPick, onBlankTap }) {
  useMapEvents({
    click(e) {
      if (onBlankTap) onBlankTap()
      else onPick?.(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function MapView({
  center,
  centerLabel,
  places = [],
  ranks,
  selectedId,
  onSelectPlace,
  onPick,
  onBlankTap,
  baseMap = 'osm',
  vworldKey,
}) {
  const useVworld = baseMap === 'vworld' && !!vworldKey
  const tile = useVworld ? vworldTile(vworldKey) : OSM
  const hasSelection = selectedId != null

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={15}
      scrollWheelZoom
      attributionControl={false}
      zoomControl={false}
      className="map-canvas"
    >
      <TileLayer
        key={useVworld ? 'vworld' : 'osm'}
        url={tile.url}
        attribution={tile.attribution}
        maxZoom={19}
        referrerPolicy="no-referrer-when-downgrade"
      />
      <Recenter center={center} />
      <FitToPlaces places={places} center={center} />
      <PanToSelected places={places} selectedId={selectedId} />
      <ClickToPick onPick={onPick} onBlankTap={onBlankTap} />

      <Marker position={[center.lat, center.lng]} icon={centerIcon} interactive={false}>
        {centerLabel ? (
          <Tooltip permanent direction="top" offset={[0, -8]} className="center-label">
            {centerLabel}
          </Tooltip>
        ) : null}
      </Marker>

      {places
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => {
          const rank = ranks?.get(p.restaurantId)
          const selected = selectedId === p.restaurantId
          const dimmed = hasSelection && !selected
          const icon = rank ? rankIcon(rank, selected, dimmed) : dotIcon(selected, dimmed)
          return (
            <Marker
              key={p.restaurantId ?? `${p.name}-${p.lat}`}
              position={[p.lat, p.lng]}
              icon={icon}
              zIndexOffset={selected ? 2000 : rank ? 1000 - rank : 0}
              eventHandlers={{ click: () => onSelectPlace?.(p.restaurantId) }}
            >
              {/* top3는 상시 이름 라벨(네이버 캡션 패턴), 밀린 곳 점은 선택했을 때만 승격 버블(에어비앤비 도트 패턴) */}
              {rank ? (
                // key 로 상태 변화 시 리마운트 — react-leaflet Tooltip 은 className 을 갱신하지 않는다
                <Tooltip
                  key={`cap-${p.restaurantId}-${selected}-${dimmed}`}
                  permanent
                  direction="top"
                  offset={[0, -34]}
                  className={`pin-cap rank-${rank}${selected ? ' sel' : ''}${dimmed ? ' dim' : ''}`}
                  interactive
                >
                  {rank}위 {p.name}
                </Tooltip>
              ) : selected ? (
                <Tooltip key={`dcap-${p.restaurantId}`} permanent direction="top" offset={[0, -10]} className="dot-cap">
                  {p.name}
                </Tooltip>
              ) : null}
            </Marker>
          )
        })}
    </MapContainer>
  )
}
