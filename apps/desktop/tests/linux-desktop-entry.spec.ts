import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

interface DesktopManifest {
  readonly desktopName?: string
}

describe('Linux desktop entry', () => {
  it('names the running window after the installed desktop entry', () => {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as DesktopManifest
    // Electron takes the Wayland app_id and X11 WM_CLASS from this name, so it must match the
    // desktop file that carries the icon; without it the dock shows a window without an application icon.
    expect(manifest.desktopName).toBe('com.deepseek.harness.desktop')
  })

  it('publishes the AppImage entry under the manifest desktop name', async () => {
    const { createElectronBuilderConfig } = await import('../scripts/electron-builder-config.mjs')
    const config = createElectronBuilderConfig({
      DSH_DESKTOP_APP_ID: 'com.deepseek.harness',
      DSH_DESKTOP_UNSIGNED: '1',
      DSH_DESKTOP_TARGET_PLATFORM: 'linux',
      DSH_DESKTOP_TARGET_ARCH: 'x64',
    }, 'linux', 'x64')
    // syncDesktopName names the AppImage entry from package.json desktopName instead of the
    // executable name; the Icon key stays the executable name electron-builder installs.
    expect(config.linux).toMatchObject({ executableName: 'deepseek-harness', syncDesktopName: true })
  })
})
