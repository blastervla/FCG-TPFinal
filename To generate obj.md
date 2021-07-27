To generate .obj
================

Rows:

* `v X Y Z` --> Vertex declaration
* `vn X Y Z` --> Vertex normal declaration
* `vt X Y` --> Vertex texture coordinate declaration
* `f V1 V2... Vn` where `Vx = vertexId/textureId/normalId` --> Face declaration
    * Essentially, we declare the face by detailing which vertexes (+ normals + textures) composes it.