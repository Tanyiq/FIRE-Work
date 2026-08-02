import './services/snapshotService'
import { themeService } from './services/themeService'

App<IAppOption>({
  globalData: {
    version: '1.1.1',
  },
  onLaunch() {
    themeService.applyNativeTheme()
  },
  onShow() {
    themeService.applyNativeTheme()
  },
})
