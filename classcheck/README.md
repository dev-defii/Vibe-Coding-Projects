# ClassCheck 📋

**ClassCheck** is an attendance and roster management tool tailored for college class officers and professors. It provides a clean, high-contrast, accessible interface for managing classes, enrolling students, pasting rosters in bulk, and importing/exporting spreadsheets.

---

## 🚀 Getting Started

### 1. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to the printed local address (typically `http://localhost:5173/`).

### 2. Build for Production
```bash
npm run build
```
This generates an optimized static production bundle in the `dist/` directory.

### 3. Preview Production Build
```bash
npm run preview
```
Runs a local web server to test the production build at `http://localhost:4173/`.

### 4. Run Linter
```bash
npm run lint
```

---

## ✨ Features Implemented (Milestone 1)

1. **Dashboard Overview:**
   - Real-time metric cards for Total Students, Total Classes, and Attendance Sessions.
   - Course summary table with student counts and direct roster navigation.
   - One-click "Load Sample Data" and "Reset Data" controls.

2. **Class Management:**
   - Create, edit, and delete classes.
   - Required fields: Class Name (e.g., "Data Structures and Algorithms"), Subject Code (e.g., "CS 201"), and Section (e.g., "BSCS 2-A").
   - Search classes by title, subject, or section.
   - Deletion protection with warning modal indicating enrolled students.

3. **Student Roster Management:**
   - Class selector bar to easily switch between cohorts.
   - Add single students with Student ID and Full Name.
   - Edit and delete individual student records with confirmation.
   - Search students by name or ID.
   - Sort roster alphabetically (A-Z, Z-A) or by Student ID.

4. **Bulk Student Entry & Excel/CSV Support:**
   - **Paste text:** Paste multiple names into a text area, one per line. Supports both plain names (with auto-generated sequential IDs) and `ID, Name` format.
   - **Spreadsheet upload:** Upload `.xlsx`, `.xls`, or `.csv` files using SheetJS (`xlsx`).
   - **Live Preview Table:** Previews parsed student rows before committing them to the roster.
   - **Export Roster:** Export any class roster directly to Excel (`.xlsx`) or CSV.

5. **Persistent Storage:**
   - All classes and student records are automatically saved in `localStorage`.
   - Data persists across page refreshes and browser restarts.

6. **Accessible & Responsive Design:**
   - Navy blue (`#0f1d40`, `#1b2f5b`) and vibrant blue (`#2563eb`) palette on a crisp light background.
   - Large buttons (minimum 44px height) and high-contrast text designed for ease of use by professors.
   - Fully responsive for mobile and desktop screens.
