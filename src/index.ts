#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs";
import process from "process";

// Initialize a new command program
const program = new Command();

/* key contraints */
const Keys = {
    // We use ESCAPE to switch from INSERT to NORMAL mode
    ESCAPE: "\x1b",
    COLON: ":",
    ENTER: "\r",
    BACKSPACE: "\x7f",
    ARROW_UP: "\x1b[A",
    ARROW_DOWN: "\x1b[B",
    ARROW_RIGHT: "\x1b[C",
    ARROW_LEFT: "\x1b[D",
};

const Terminal = {
    clearScreen: () => {
        process.stdout.write("\x1b[2J\x1b[H");
    },
    moveCursor: (row: number, col: number) => {
        process.stdout.write(`\x1b[${row + 1};${col + 1}H`);
    },
    invertColors: () => {
        process.stdout.write("\x1b[7m");
    },
    resetColors: () => {
        process.stdout.write("\x1b[m");
    },
};

/* Editor state */
const Editor = {
    filePath: "",
    lines: [] as string[],
    cursorX: 0,
    cursorY: 0,
    screenRows: process.stdout.rows,
    screenCols: process.stdout.columns,
    //we start with a NORMAL mode(typical vim feature)
    mode: "NORMAL",
    commandString: "",
    status: "HELP: Press `i` for insert | `ESC` to exit | `:w` to save | `:wq` to save & exit | `:q` to exit",
};

function render() {
    Terminal.clearScreen();

    // 1. Draw the text content
    // \r(carriage return) moves the cursor to the start of the current line
    for (let i = 0; i < Editor.screenRows - 1; i++) {
        if (i < Editor.lines.length) {
            process.stdout.write(Editor.lines[i] + "\r\n");
        } else {
            process.stdout.write("~\r\n");
        }
    }

    //2. Draw the status bar
    Terminal.invertColors();
    let statusBar;
    if (Editor.mode == "COMMAND") {
        statusBar = `:${Editor.commandString}`;
    } else {
        const modeIndicator = `-- ${Editor.mode} --`;
        const position = `${Editor.cursorY + 1}:${Editor.cursorX + 1}`;
        statusBar = `${modeIndicator} | ${position} | ${Editor.filePath}`;
    }

    process.stdout.write(statusBar.padEnd(Editor.screenCols));
    Terminal.resetColors();

    //3. status message line (if not in command mode)
    if (Editor.mode !== "COMMAND") {
        process.stdout.write("\r\n" + Editor.status.padEnd(Editor.screenCols));
    }

    //4. move cursor to its correct position
    // if in command mode, cursor moves to the status bar, otherwise to text area
    if (Editor.mode == "COMMAND") {
        Terminal.moveCursor(
            Editor.screenRows - 1,
            Editor.commandString.length + 1
        );
    } else {
        Terminal.moveCursor(Editor.cursorY, Editor.cursorX);
    }
}

function saveFile() {
    try {
        fs.writeFileSync(Editor.filePath, Editor.lines.join("\n"));
        Editor.status = `File saved successfully! (${Editor.lines.length} lines)`;
    } catch (error) {
        Editor.status = `Error saving file: ${error}`;
    }
}

function handleNormalModeKeypress(key: string) {
    switch (key) {
        case "i":
            Editor.mode = "INSERT";
            Editor.status = "HELP: press `ESC` to return to NORMAL mode. ";
            break;

        case Keys.COLON:
            Editor.mode = "COMMAND";
            Editor.commandString = "";
            break;

        // navigation using h,j,k,l
        case 'k':
        case Keys.ARROW_UP:
            if (Editor.cursorY > 0) Editor.cursorY--;
            break;

        case 'j':
        case Keys.ARROW_DOWN:
            if (Editor.cursorY < Editor.lines.length - 1) Editor.cursorY++;
            break;
        
        case 'h':
        case Keys.ARROW_LEFT:
            if(Editor.cursorX > 0)Editor.cursorX--;
            break;

        case 'l':
            case Keys.ARROW_RIGHT:
                if(Editor.cursorX < Editor.lines[Editor.cursorY].length)Editor.cursorX++;
                break;
        
        default:
            break;
    }
}

function handleInsertModeKeypress(key: string){
    switch(key){
        case Keys.ESCAPE:
            Editor.mode = 'NORMAL'
            Editor.status = 'HELP: Press `i` to insert | `ESC` to exit | `:w` to save | `:q` to quit'

            if(Editor.cursorX > 0 && Editor.cursorX >= Editor.lines[Editor.cursorY].length){
                Editor.cursorX = Math.max(0, Editor.lines[Editor.cursorY].length-1)
            }
            break;

        case Keys.ENTER:
            const currentLine = Editor.lines[Editor.cursorY]
            const newLine = currentLine.substring(Editor.cursorX)
    }
}

function handleKeypress(key: string) {
    if (Editor.mode == "NORMAL") {
        handleNormalModeKeypress(key);
    } else if (Editor.mode == "INSET") {
        handleInsertModeKeypress(key);
    } else {
        handleCommandModeKeyPress(key);
    }
    render();
}

/* setup and initialization part */

/*  1. Read the file
    2. Store and insert that into editor's current state (Editor.lines)
*/
function runEditor(filePath: string) {
    Editor.filePath = filePath;
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        Editor.lines = fileContent.split("\n");
    } catch (error) {
        Editor.lines = [""];
    }

    process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", handleKeypress);

    render();
}

program
    .name("as-nano")
    .description("CLI text-editor like nano")
    .version("1.0.0");

program
    .argument("<filename>", "The file to open or create")
    .action((filename) => {
        runEditor(filename);
    });

program.parse(process.argv);
