({
    appDir: "source",
    baseUrl: "./",
    // dir: "build",
    optimize: "none",
    // paths: {
    //     "jquery": "require-jquery"
    // },
    // optimize: "closure",
    // optimize: "uglify",
    out: "scripts/PickletExport.jsx",
    create: true,
    include: ["main", "ExportController", "PickletModel", "SettingsView", "json2"],
})
