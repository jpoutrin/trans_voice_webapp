# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['main.py'],
    pathex=[''],
    binaries=[('/usr/local/bin/ffmpeg', '.')],
    datas=[('./templates', 'templates'), ('./static', 'static'), ('./models', 'inaSpeechSegmenter')],
    hiddenimports=['ml_dtypes', 'ffmpeg'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='main',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='main',
)

app = BUNDLE(exe,
        coll,
         name='Voice.app',
         icon=None,
         bundle_identifier='org.vancdk.transvoice')