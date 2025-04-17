# SIC Assembler App

A web-based assembler for the **Simplified Instructional Computer (SIC)** architecture. This tool allows users to input SIC assembly code, perform Pass 1 and Pass 2 of the assembler process, and generate object code, symbol tables, and listing files—all from a user-friendly interface.

> 🌐 **Live Demo**: [https://sic-assembler-app.vercel.app](https://sic-assembler-app.vercel.app)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Assembler Workflow](#assembler-workflow)
- [Screenshots](#screenshots)

---

## Features

-  Input editor for SIC assembly programs
-  Performs **Pass 1**: Symbol Table generation, location counters
-  Performs **Pass 2**: Object code and listing file generation
-  Displays symbol table, intermediate file, and object program
-  Validates instructions and generates errors for invalid input
-  Fully web-based—no installation required for use
-  Responsive, clean UI using Tailwind CSS

---

## Tech Stack

- [Next.js](https://nextjs.org/) – React-based framework for SSR and SSG
- [TypeScript](https://www.typescriptlang.org/) – Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS for styling

---


### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm (comes with Node.js)

## Project Structure
The folder structure of the app is designed to be modular and easy to scale. Below is a visual representation:
![image](https://github.com/user-attachments/assets/f43f7b5f-24f7-41ee-b68e-8d44c505c42d)



## Assembler Workflow
The app simulates a two-pass SIC assembler:

### Pass 1:
- Reads each line of the program
- Assigns location counter (LOCCTR)
- Creates the symbol table (SYMTAB)
- Produces intermediate file

### Pass 2:
- Uses the intermediate file and SYMTAB
- Generates object code and handles address resolution
- Outputs:
  - Object Program
  - Listing File


## Screenshots
<img width="1440" alt="Screenshot 2025-04-17 at 11 45 12 AM" src="https://github.com/user-attachments/assets/f896d3a1-f0cc-44be-8bd6-58d9aff8b103" />
<img width="1440" alt="Screenshot 2025-04-17 at 11 45 20 AM" src="https://github.com/user-attachments/assets/c21cac2e-83f3-4452-97dc-8e853a5fd305" />
<img width="1440" alt="Screenshot 2025-04-17 at 11 45 32 AM" src="https://github.com/user-attachments/assets/dea3748e-2498-4953-9291-cc0785f393e1" />
<img width="1440" alt="Screenshot 2025-04-17 at 11 45 43 AM" src="https://github.com/user-attachments/assets/e67fdee6-8da6-4945-9bbb-2f79df1ea2aa" />


