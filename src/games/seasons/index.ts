import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { createMascotPlaceholder, setMascotPose } from '../../mascot'
import {
  clampWeather,
  comfortHintAfterSeasonChange,
  displayOutfit,
  flowerMood,
  RAINBOW_PARENT_HINT,
  SEASON_ICON,
  SEASON_LABEL,
  SEASONS,
  sunWeatherAfterRain,
  WEATHER_LABEL,
  weatherPickerOptions,
  type Season,
  type Weather,
} from './logic'
import { pickSeasonWeatherPraise } from './praise'
import { playSeasonWeatherChange } from './seasons-sfx'
import './seasons.css'

export const seasonsGame: GameModule = {
  meta: {
    id: 'seasons',
    title: 'Времена года',
    zoneId: 'rainbow-meadow',
    modules: ['2.10'],
  },

  mount(container, context) {
    unmountInternal()
    const audio = createAudioManager(context.settings)
    void audio.unlock()

    let season: Season = 'summer'
    let weather: Weather = 'sun'
    let coatOn = false
    let hadRain = false
    let snowmanCarrot = false

    root = document.createElement('section')
    root.className = 'seasons-game'
    root.dataset.gameId = 'seasons'

    const weatherPanel = document.createElement('aside')
    weatherPanel.className = 'seasons-game__weather-panel'
    const weatherHeading = document.createElement('p')
    weatherHeading.className = 'seasons-game__panel-title screen__lead--adult'
    weatherHeading.textContent = 'Погода'
    const weatherCol = document.createElement('div')
    weatherCol.className = 'seasons-game__weather-col'
    weatherCol.setAttribute('role', 'group')
    weatherCol.setAttribute('aria-label', 'Погода')
    weatherPanel.append(weatherHeading, weatherCol)

    const main = document.createElement('div')
    main.className = 'seasons-game__main'

    const seasonPanel = document.createElement('div')
    seasonPanel.className = 'seasons-game__season-panel'
    const seasonHeading = document.createElement('p')
    seasonHeading.className = 'seasons-game__panel-title screen__lead--adult'
    seasonHeading.textContent = 'Сезон'
    const seasonRow = document.createElement('div')
    seasonRow.className = 'seasons-game__season-row'
    seasonRow.setAttribute('role', 'group')
    seasonRow.setAttribute('aria-label', 'Сезон')
    seasonPanel.append(seasonHeading, seasonRow)

    const stage = document.createElement('div')
    stage.className = 'seasons-game__stage'
    stage.setAttribute('role', 'img')

    const playground = document.createElement('div')
    playground.className = 'seasons-game__playground'
    playground.setAttribute('aria-hidden', 'true')

    const building = document.createElement('div')
    building.className = 'seasons-game__building'

    const swings = document.createElement('div')
    swings.className = 'seasons-game__swings'

    const sandbox = document.createElement('div')
    sandbox.className = 'seasons-game__sandbox'

    playground.append(building, swings, sandbox)

    const fx = document.createElement('div')
    fx.className = 'seasons-game__fx'
    fx.setAttribute('aria-hidden', 'true')

    const leaves = document.createElement('div')
    leaves.className = 'seasons-game__leaves'
    leaves.setAttribute('aria-hidden', 'true')

    const meowBtn = document.createElement('button')
    meowBtn.type = 'button'
    meowBtn.className = 'seasons-game__meow-btn touch-btn'
    meowBtn.setAttribute('aria-label', 'Мяу — куртка')

    const meowWrap = document.createElement('div')
    meowWrap.className = 'seasons-game__meow-wrap'

    const meow = createMascotPlaceholder('happy')
    meow.classList.add('seasons-game__meow')
    meowWrap.append(meow)
    meowBtn.append(meowWrap)

    const snowman = document.createElement('button')
    snowman.type = 'button'
    snowman.className = 'seasons-game__snowman touch-btn'
    snowman.hidden = true
    snowman.setAttribute('aria-label', 'Снеговик')

    const carrot = document.createElement('span')
    carrot.className = 'seasons-game__snowman-carrot'
    carrot.setAttribute('aria-hidden', 'true')
    snowman.append(carrot)

    stage.append(fx, leaves, playground, snowman, meowBtn)
    main.append(seasonPanel, stage)
    root.append(weatherPanel, main)
    container.replaceChildren(root)

    function setStatus(message: string): void {
      context.onSoftHint?.(message)
    }

    function applyStageVisuals(): void {
      weather = clampWeather(season, weather)
      root!.dataset.season = season
      root!.dataset.weather = weather
      root!.dataset.coat = coatOn ? 'on' : 'off'
      stage.dataset.season = season
      stage.dataset.weather = weather

      const outfit = displayOutfit(season, weather, coatOn)
      meowWrap.dataset.outfit = outfit
      fx.dataset.weather = weather
      leaves.hidden = season !== 'autumn'
      snowman.hidden = season !== 'winter'
      snowman.classList.toggle('has-carrot', snowmanCarrot)

      setMascotPose(meow, weather === 'sun' || weather === 'rainbow' ? 'happy' : 'idle')
      stage.setAttribute(
        'aria-label',
        `Двор и площадка. ${SEASON_LABEL[season]}, ${WEATHER_LABEL[weather]}.`,
      )
      sandbox.dataset.mood = flowerMood(weather)
    }

    function onWeatherPick(next: Weather): void {
      let resolved = next
      if (next === 'rain') hadRain = true
      if (next === 'sun') {
        resolved = sunWeatherAfterRain(season, hadRain)
        if (resolved === 'rainbow') {
          hadRain = false
          setStatus(`${pickSeasonWeatherPraise()} ${RAINBOW_PARENT_HINT}`)
        }
      }

      if (weather === resolved) {
        setStatus(`${SEASON_LABEL[season]}, ${WEATHER_LABEL[weather]}.`)
        return
      }
      weather = resolved
      playSeasonWeatherChange(audio, weather)
      applyStageVisuals()
      if (weather !== 'rainbow') {
        setStatus(`${pickSeasonWeatherPraise()} ${WEATHER_LABEL[weather]}.`)
      }
      renderWeatherPanel()
    }

    function onSeasonPick(next: Season): void {
      season = next
      weather = clampWeather(season, weather)
      if (season !== 'winter') snowmanCarrot = false
      playSeasonWeatherChange(audio, weather)
      applyStageVisuals()
      const comfort = comfortHintAfterSeasonChange(season, coatOn)
      setStatus(comfort ?? `${SEASON_LABEL[season]}, ${WEATHER_LABEL[weather]}.`)
      renderSeasonPanel()
      renderWeatherPanel()
    }

    function onMeowTap(): void {
      if (weather === 'rain' || weather === 'snow') {
        setStatus('Сейчас Мяу уже в непогоде.')
        return
      }
      coatOn = !coatOn
      applyStageVisuals()
      setStatus(
        coatOn ? 'Мяу в куртке!' : 'Мяу без куртки.',
      )
    }

    function onSnowmanTap(): void {
      snowmanCarrot = !snowmanCarrot
      snowman.classList.toggle('has-carrot', snowmanCarrot)
      setStatus(snowmanCarrot ? 'Морковка для снеговика!' : 'Снеговик без морковки.')
    }

    meowBtn.addEventListener('click', onMeowTap)
    snowman.addEventListener('click', onSnowmanTap)

    function renderSeasonPanel(): void {
      seasonRow.replaceChildren()
      for (const s of SEASONS) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'seasons-game__season-pick touch-btn'
        if (s === season) btn.classList.add('is-active')

        const icon = document.createElement('span')
        icon.className = 'seasons-game__season-pick-icon'
        icon.textContent = SEASON_ICON[s]
        icon.setAttribute('aria-hidden', 'true')

        const label = document.createElement('span')
        label.className = 'seasons-game__season-pick-label screen__lead--adult'
        label.textContent = SEASON_LABEL[s]

        btn.append(icon, label)
        btn.setAttribute('aria-label', SEASON_LABEL[s])
        btn.addEventListener('click', () => onSeasonPick(s))
        seasonRow.append(btn)
      }
    }

    function renderWeatherPanel(): void {
      weatherCol.replaceChildren()
      for (const w of weatherPickerOptions(season)) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'seasons-game__weather-pick touch-btn'
        if (w === weather) btn.classList.add('is-active')
        btn.textContent = WEATHER_LABEL[w]
        btn.setAttribute('aria-label', WEATHER_LABEL[w])
        btn.addEventListener('click', () => onWeatherPick(w))
        weatherCol.append(btn)
      }
    }

    applyStageVisuals()
    renderSeasonPanel()
    renderWeatherPanel()
    setStatus('Тапни сезон или погоду. Мяу на площадке во дворе.')

    cleanup = () => {
      if (root?.parentElement) root.parentElement.removeChild(root)
      root = null
      cleanup = null
    }
  },

  unmount() {
    unmountInternal()
  },
}

let root: HTMLElement | null = null
let cleanup: (() => void) | null = null

function unmountInternal(): void {
  cleanup?.()
  cleanup = null
  root = null
}
