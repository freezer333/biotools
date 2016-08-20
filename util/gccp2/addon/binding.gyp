{
  "targets": [
    {
      "target_name": "qgrs2",
      "sources": [ "g.cpp", "gfind.cpp" ],
      "include_dirs" : ["<!(node -e \"require('nan')\")"],
    }
  ]
}