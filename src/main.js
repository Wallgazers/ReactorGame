import kaplay from "kaplay";

const SPEED = 480;

// TODO: later map size should scale with a difficulty slider
const MAP_WIDTH = 512; 
const MAP_HEIGHT = 512;
const MAP_WALL = 24;
const BOUNDS_OFFSET = 128;

const k = kaplay();

k.loadRoot("./"); 
k.loadSprite("crab", "sprites/crab.png");

k.onClick(() => k.addKaboom(k.mousePos()));

k.scene("main", () => {

    const player = k.add([
        k.sprite("crab"),
        k.pos(BOUNDS_OFFSET, MAP_HEIGHT/2),
        k.area(),
        k.body(),
        { dir: k.vec2(0, 0) },
    ]);

    // add left wall
    add([
        k.rect(MAP_WALL, 2*MAP_WALL + MAP_HEIGHT),
        k.pos(BOUNDS_OFFSET, BOUNDS_OFFSET),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0)
    ]);

    // add right wall
    add([
        k.rect(MAP_WALL, 2*MAP_WALL + MAP_HEIGHT),
        k.pos(BOUNDS_OFFSET + MAP_WALL + MAP_WIDTH, BOUNDS_OFFSET),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0)
    ]);

    // add top wall
    add([
        k.rect(MAP_WIDTH, MAP_WALL),
        k.pos(BOUNDS_OFFSET + MAP_WALL, BOUNDS_OFFSET),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0)
    ]);

    // add bottom wall
    add([
        k.rect(MAP_WIDTH, MAP_WALL),
        k.pos(BOUNDS_OFFSET + MAP_WALL, BOUNDS_OFFSET + MAP_WALL + MAP_HEIGHT),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0)
    ]);

    function move_player() {
        let dir = k.vec2(0, 0);

        if (k.isKeyDown("a")) dir.x -= 1;
	    if (k.isKeyDown("d")) dir.x += 1;
	    if (k.isKeyDown("w")) dir.y -= 1;
	    if (k.isKeyDown("s")) dir.y += 1;

        dir = dir.unit();
        player.dir = dir;
        player.move(player.dir.scale(SPEED));
    }

    k.onUpdate(() => {
        move_player();
    })

});

k.go("main");