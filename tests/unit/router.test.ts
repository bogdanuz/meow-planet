import { describe, expect, it } from 'vitest'
import { parseHash, routeToHash } from '../../src/app/router'

describe('parseHash', () => {
  it('пустой hash → меню', () => {
    expect(parseHash('')).toEqual({ screen: 'menu' })
    expect(parseHash('#')).toEqual({ screen: 'menu' })
    expect(parseHash('#/')).toEqual({ screen: 'menu' })
    expect(parseHash('#/menu')).toEqual({ screen: 'menu' })
    expect(parseHash('#/map')).toEqual({ screen: 'menu' })
  })

  it('welcome и старый loading', () => {
    expect(parseHash('#/welcome')).toEqual({ screen: 'welcome' })
    expect(parseHash('#/loading')).toEqual({ screen: 'welcome' })
  })

  it('игра и родительский центр', () => {
    expect(parseHash('#/game/balloon-pop')).toEqual({
      screen: 'game',
      gameId: 'balloon-pop',
    })
    expect(parseHash('#/parent')).toEqual({ screen: 'parent' })
  })

  it('старые zone-ссылки → меню; неизвестная игра → not-found', () => {
    expect(parseHash('#/zone/rainbow-meadow')).toEqual({ screen: 'menu' })
    expect(parseHash('#/game/nope')).toEqual({ screen: 'not-found' })
    expect(parseHash('#/foo/bar')).toEqual({ screen: 'not-found' })
  })

  it('routeToHash обратимо для основных экранов', () => {
    expect(routeToHash({ screen: 'menu' })).toBe('#/')
    expect(routeToHash({ screen: 'welcome' })).toBe('#/welcome')
    expect(routeToHash({ screen: 'game', gameId: 'counting' })).toBe(
      '#/game/counting',
    )
    expect(routeToHash({ screen: 'parent' })).toBe('#/parent')
  })
})
