const level1_coordinates = [
    vec2(2, 0),
    vec2(2, 2),
    vec2(1, 3),
    vec2(3, 3)
]

class Board {
    constructor(coordinates) {
        this.clickedPlatform = null;
        // coordinates should be list of vectors.
        this.platforms = [];
        for (let i = 0; i < 5; i++) {
            const newRow = []
            for (let j = 0; j < 5; j++) {
                // 호퍼스 게임보드의 구조에 맞는 경우에만 플랫폼 추가
                const newPlatform = (i + j) % 2 ? null : new Platform(j, i, this)
                newRow.push(newPlatform)
            }
            this.platforms.push(newRow)
        }

        for (let coordinate of coordinates) {
            this.platforms[coordinate[1]][coordinate[0]].setFrog()
        }
    }

    display() {
        let totalFrogCount = 0;
        for (let row of this.platforms) {
            for (let platform of row) {
                if (platform) {
                    if (platform.frog) {
                        platform.htmlObject.textContent = "Frog";
                        platform.htmlObject.style.backgroundColor = "green";
                        totalFrogCount++;
                    } else {
                        platform.htmlObject.textContent = "";
                        platform.htmlObject.style.backgroundColor = "#3498db";
                    }
                }
            }
        }
        return totalFrogCount === 1;
    }

    hop(destination) {
        const origin = this.clickedPlatform;
        if (Math.abs(origin.x - destination.x) === 2
            && Math.abs(origin.y - destination.y) === 2
            && this.platforms[(origin.y + destination.y)/2][(origin.x + destination.x)/2].frog) {
            console.log("hop")
            destination.frog = origin.frog;
            origin.frog = this.platforms[(origin.y + destination.y)/2][(origin.x + destination.x)/2].frog = null;
            if (this.display()) {
                document.getElementById("scoreboard").textContent = "cleared!"
                console.log("stage cleared!")
            }
        }
        else {
            origin.htmlObject.style.backgroundColor = "green";
        }
        this.clickedPlatform = null;
    }
}

class Platform {
    constructor(x, y, board) {
        this.x = x;
        this.y = y;
        this.htmlObject = document.querySelector(`.circle.x${x}.y${y}`);
        this.frog = null;
        const thisPlatform = this;
        this.htmlObject.onclick = function () {
            if (thisPlatform.frog && !board.clickedPlatform) {
                board.clickedPlatform = thisPlatform;
                thisPlatform.htmlObject.style.backgroundColor = "red";
            } else {
                board.hop(thisPlatform);
            }
        }
    }

    setFrog() {
        this.frog = new Frog()
    }
}

class Frog {
    constructor() {
    }
}

window.onload = function init() {
    const mainBoard = new Board(level1_coordinates)
    console.log(mainBoard);
    mainBoard.display()
}