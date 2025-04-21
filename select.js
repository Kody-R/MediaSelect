let movies = [];

const selectedMap = new Map();


document.addEventListener('DOMContentLoaded', function () {
    fetch('movies.csv')
        .then(response => response.text())
        .then(data => {
            parseCSV(data);
        })
        .catch(error => console.error('Error loading CSV:', error));
});

function parseCSV(csvData) {
    const lines = csvData.trim().split('\n').slice(1);
    movies = lines.map(line => {
        const [title, year, size, genre] = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(field => field.replace(/(^"|"$)/g, '').trim());
        return { title, year, size, genre };
    });

    populateGenres();
    renderMovies(movies);
}

function populateGenres() {
    const genreSet = new Set();
    movies.forEach(movie => {
        movie.genre.split(',').forEach(g => {
            genreSet.add(g.trim().replace(/^"|"$/g, '')); // Remove leading/trailing quotes
        });
    });

    const genreFilter = document.getElementById('genreFilter');
    genreFilter.innerHTML = '<option value="All">All Genres</option>';
    Array.from(genreSet).sort().forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreFilter.appendChild(option);
    });
}


function renderMovies(movieList) {
    const movieForm = document.getElementById('movieForm');
    movieForm.innerHTML = '';

    movieList.forEach((movie, index) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'movie';
        checkbox.value = `${movie.title} (${movie.year})`;
        checkbox.id = `movie-${index}`;
        checkbox.checked = selectedMap.get(checkbox.value) || false;


        checkbox.addEventListener('change', function () {
            selectedMap.set(checkbox.value, checkbox.checked);
            updateSelectedCount();
        });
        

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(`${movie.title} (${movie.year})`));
        movieForm.appendChild(label);
    });

    updateSelectedCount();
}

function filterByGenre() {
    const selectedGenre = document.getElementById('genreFilter').value;
    if (selectedGenre === 'All') {
        renderMovies(movies);
    } else {
        const filtered = movies.filter(movie => movie.genre.includes(selectedGenre));
        renderMovies(filtered);
    }
}

function selectAllVisible(select = true) {
    document.querySelectorAll('#movieForm input[type="checkbox"]').forEach(cb => cb.checked = select);
    updateSelectedCount();
}

function downloadSelections() {
    const selected = Array.from(selectedMap.entries())
        .filter(([_, checked]) => checked)
        .map(([key]) => key);

    if (selected.length === 0) return;

    const selectedMovies = selected.map(val => {
        const [title, year] = val.match(/^(.*) \((\d{4})\)$/).slice(1, 3);
        const movie = movies.find(m => m.title === title && m.year === year);
        return movie ? `${movie.title} (${movie.year}) - ${movie.size}` : '';
    }).filter(Boolean);

    const totalSizeGB = selectedMovies.reduce((sum, line) => {
        const match = line.match(/- ([\d.]+) (GB|MB)/);
        if (match) {
            let size = parseFloat(match[1]);
            if (match[2] === 'MB') size /= 1024;
            return sum + size;
        }
        return sum;
    }, 0);

    selectedMovies.push('');
    selectedMovies.push(`Total Titles: ${selected.length}`);
    selectedMovies.push(`Total Size: ${totalSizeGB.toFixed(2)} GB`);

    const blob = new Blob([selectedMovies.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected_movies.txt';
    a.click();

    URL.revokeObjectURL(url);
}


function updateSelectedCount() {
    let count = 0;
    let totalSizeGB = 0;

    for (const [key, isChecked] of selectedMap.entries()) {
        if (isChecked) {
            count++;
            const [title, year] = key.match(/^(.*) \((\d{4})\)$/).slice(1, 3);
            const movie = movies.find(m => m.title === title && m.year === year);
            if (movie) {
                const match = movie.size.match(/^([\d.]+)\s*(GB|MB)$/i);
                if (match) {
                    let size = parseFloat(match[1]);
                    if (match[2].toUpperCase() === 'MB') size /= 1024;
                    totalSizeGB += size;
                }
            }
        }
    }

    const display = `Selected: ${count} movie${count !== 1 ? 's' : ''} — ${totalSizeGB.toFixed(2)} GB`;
    document.getElementById('selectedCount').textContent = display;
}

