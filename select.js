let movies = [];

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
        movie.genre.split(',').forEach(g => genreSet.add(g.trim()));
    });

    const genreFilter = document.getElementById('genreFilter');
    genreFilter.innerHTML = '<option value="All">All Genres</option>'; // Reset first
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

        checkbox.addEventListener('change', updateSelectedCount);

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
    const selected = Array.from(document.querySelectorAll('input[name="movie"]:checked')).map(cb => cb.value);
    const blob = new Blob([selected.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected_movies.txt';
    a.click();

    URL.revokeObjectURL(url);
}

function updateSelectedCount() {
    const selected = document.querySelectorAll('#movieForm input[type="checkbox"]:checked').length;
    document.getElementById('selectedCount').textContent = `Selected: ${selected}`;
}
