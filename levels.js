var LEVELS = [
    {
        width: 5,
        height: 5,
        walls: [
            [12, 17]
        ],
        goal: 7,
        pieces: [0, 24],
        targets: [12]
    },
    {
        width: 5,
        height: 5,
        walls: [
            [10, 15],
            [18, 19],
            [4, 9]
        ],
        goal: 10,
        pieces: [11, 13],
        targets: [16, 18],
        shape: [
            "xxxxx",
            "xx.xx",
            "xx.xx",
            "xx.xx",
            "xxxxx",
        ]
    },
    {
        width: 4,
        height: 4,
        walls: [
            [4, 5],
            [6, 7],
            [8, 9],
            [10, 11]
        ],
        goal: 12,
        pieces: [1, 13],
        targets: [6, 14]
    },
    {
        width: 7,
        height: 7,
        walls: [],
        goal: 13,
        pieces: [10, 38, 24],
        targets: [23, 25],
        shape: [
            "..xxx..",
            "..xxx..",
            "xxxxxxx",
            "xxxxxxx",
            "xxxxxxx",
            "..xxx..",
            "..xxx..",
        ]
    },
    {
        width: 5,
        height: 5,
        walls: [
            [5, 6],
            [6, 7],
            [7, 8],
            [8, 9],
            [5, 10],
            [9, 14],
            [10, 15],
            [14, 19],
            [15, 16],
            [16, 17],
            [17, 18],
            [18, 19],
        ],
        goal: 20,
        pieces: [1, 10, 14],
        targets: [12]
    },
    {
        width: 7,
        height: 7,
        walls: [],
        goal: 20,
        pieces: [16, 32, 13, 35],
        targets: [21, 27],
        shape: [
            ".#.#.#.",
            "#######",
            ".##.##.",
            "##...##",
            ".##.##.",
            "#######",
            ".#.#.#."
        ]
    }
];
