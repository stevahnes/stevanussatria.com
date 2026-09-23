---
layout: home
title: "Bookshelf"
description: "Explore Stevanus Satria's PM Diet: books, podcasts, and articles shaping product thinking and execution."
keywords: "Stevanus Satria, bookshelf, PM Diet, product management books, product podcasts, product articles"
author: "Stevanus Satria"
head:
  - - meta
    - property: og:title
      content: "Bookshelf"
  - - meta
    - property: og:description
      content: "Explore Stevanus Satria's PM Diet: books, podcasts, and articles shaping product thinking and execution."
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:url
      content: https://stevanussatria.com/bookshelf
  - - meta
    - name: twitter:title
      content: "Bookshelf"
  - - meta
    - name: twitter:description
      content: "Explore Stevanus Satria's PM Diet: books, podcasts, and articles shaping product thinking and execution."
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - link
    - rel: canonical
      href: https://stevanussatria.com/bookshelf
---

<script setup lang="ts">
const bookshelfData = [
  {
    "id": "book-rich-dad-poor-dad",
    "type": "book",
    "title": "Rich Dad Poor Dad",
    "authorOrHost": "Robert Kiyosaki",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Rich+Dad+Poor+Dad",
    "coverImage": "https://books.google.com/books/content?id=kRqeDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-when-breath-becomes-air",
    "type": "book",
    "title": "When Breath Becomes Air",
    "authorOrHost": "Paul Kalanithi",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=When+Breath+Becomes+Air",
    "coverImage": "https://books.google.com/books/content?id=13vRjgEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"
  },
  {
    "id": "book-a-promised-land",
    "type": "book",
    "title": "A Promised Land",
    "authorOrHost": "Barack Obama",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=A+Promised+Land",
    "coverImage": "https://books.google.com/books/content?id=hvr4DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-untamed",
    "type": "book",
    "title": "Untamed",
    "authorOrHost": "Glennon Doyle",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Untamed+Glennon+Doyle",
    "coverImage": "https://books.google.com/books/content?id=rQumDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-scrum-art-of-doing-twice",
    "type": "book",
    "title": "Scrum: The Art of Doing Twice the Work in Half the Time",
    "authorOrHost": "Jeff Sutherland",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Scrum+Jeff+Sutherland",
    "coverImage": "https://books.google.com/books/content?id=_AdFDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-journey-of-ibn-fattouma",
    "type": "book",
    "title": "The Journey of Ibn Fattouma",
    "authorOrHost": "Naguib Mahfouz",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=The+Journey+of+Ibn+Fattouma",
    "coverImage": "https://books.google.com/books/content?id=KEmBAAAAIAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"
  },
  {
    "id": "book-marley-and-me",
    "type": "book",
    "title": "Marley & Me",
    "authorOrHost": "John Grogan",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Marley+and+Me",
    "coverImage": "https://books.google.com/books/content?id=vUvhik7hJgYC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-percy-jackson-series",
    "type": "book",
    "title": "Percy Jackson and the Olympians (Series)",
    "authorOrHost": "Rick Riordan",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Percy+Jackson+and+the+Olympians",
    "coverImage": "https://books.google.com/books/content?id=X58EqptgJV8C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-have-a-little-faith",
    "type": "book",
    "title": "Have a Little Faith",
    "authorOrHost": "Mitch Albom",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Have+a+Little+Faith",
    "coverImage": "https://books.google.com/books/content?id=4eqYAAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-tis-a-memoir",
    "type": "book",
    "title": "'Tis: A Memoir",
    "authorOrHost": "Frank McCourt",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Tis+A+Memoir+Frank+McCourt",
    "coverImage": "https://books.google.com/books/content?id=CfPWhC7NKlcC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-tuesdays-with-morrie",
    "type": "book",
    "title": "Tuesdays with Morrie",
    "authorOrHost": "Mitch Albom",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Tuesdays+with+Morrie",
    "coverImage": "https://books.google.com/books/content?id=z2z_6hLoPmgC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-the-little-prince",
    "type": "book",
    "title": "The Little Prince",
    "authorOrHost": "Antoine de Saint-Exupery",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=The+Little+Prince",
    "coverImage": "https://books.google.com/books/content?id=Tar-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-discourse-method-meditations",
    "type": "book",
    "title": "Discourse on Method and Meditations",
    "authorOrHost": "Rene Descartes",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Discourse+on+Method+Meditations",
    "coverImage": "https://books.google.com/books/content?id=F2wphxvBBDkC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-five-people-you-meet-in-heaven",
    "type": "book",
    "title": "The Five People You Meet in Heaven",
    "authorOrHost": "Mitch Albom",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=The+Five+People+You+Meet+in+Heaven",
    "coverImage": "https://books.google.com/books/content?id=dUeZAAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-hunger-games-trilogy",
    "type": "book",
    "title": "The Hunger Games Trilogy",
    "authorOrHost": "Suzanne Collins",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=The+Hunger+Games+Trilogy",
    "coverImage": "https://books.google.com/books/content?id=HFZnPwAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"
  },
  {
    "id": "book-angelas-ashes",
    "type": "book",
    "title": "Angela's Ashes",
    "authorOrHost": "Frank McCourt",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Angela%27s+Ashes",
    "coverImage": "https://books.google.com/books/content?id=lhFHPgAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"
  },
  {
    "id": "book-candide",
    "type": "book",
    "title": "Candide",
    "authorOrHost": "Voltaire",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Candide+Voltaire",
    "coverImage": "https://books.google.com/books/content?id=9UAMhMxslz8C&printsec=frontcover&img=1&zoom=1&source=gbs_api"
  },
  {
    "id": "book-for-one-more-day",
    "type": "book",
    "title": "For One More Day",
    "authorOrHost": "Mitch Albom",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=For+One+More+Day",
    "coverImage": "https://books.google.com/books/content?id=rUaZAAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-the-alchemist",
    "type": "book",
    "title": "The Alchemist",
    "authorOrHost": "Paulo Coelho",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=The+Alchemist+Paulo+Coelho",
    "coverImage": "https://books.google.com/books/content?id=FEL8DlqjYEkC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-battle-hymn-of-the-tiger-mother",
    "type": "book",
    "title": "Battle Hymn of the Tiger Mother",
    "authorOrHost": "Amy Chua",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=Battle+Hymn+of+the+Tiger+Mother",
    "coverImage": "https://books.google.com/books/content?id=QsEaN-leF7QC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-charlie-chan-hock-chye",
    "type": "book",
    "title": "The Art of Charlie Chan Hock Chye",
    "authorOrHost": "Sonny Liew",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=The+Art+of+Charlie+Chan+Hock+Chye",
    "coverImage": "https://books.google.com/books/content?id=rYYEDAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"
  },
  {
    "id": "book-the-trolley-problem",
    "type": "book",
    "title": "The Trolley Problem, or Would You Throw the Fat Guy Off the Bridge?",
    "authorOrHost": "Thomas Cathcart and Daniel Klein",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=The+Trolley+Problem+Cathcart",
    "coverImage": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1404580658i/17740627.jpg"
  },
  {
    "id": "book-first-phone-call-from-heaven",
    "type": "book",
    "title": "The First Phone Call from Heaven",
    "authorOrHost": "Mitch Albom",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=The+First+Phone+Call+from+Heaven",
    "coverImage": "https://books.google.com/books/content?id=PjvZswEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"
  },
  {
    "id": "book-magic-strings-of-frankie-presto",
    "type": "book",
    "title": "The Magic Strings of Frankie Presto",
    "authorOrHost": "Mitch Albom",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=The+Magic+Strings+of+Frankie+Presto",
    "coverImage": "https://books.google.com/books/content?id=lqantAEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"
  },
  {
    "id": "book-next-person-you-meet-in-heaven",
    "type": "book",
    "title": "The Next Person You Meet in Heaven",
    "authorOrHost": "Mitch Albom",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=The+Next+Person+You+Meet+in+Heaven",
    "coverImage": "https://books.google.com/books/content?id=XftNDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "book-heroes-of-olympus-series",
    "type": "book",
    "title": "The Heroes of Olympus (Series)",
    "authorOrHost": "Rick Riordan",
    "status": "completed",
    "link": "https://www.goodreads.com/search?q=The+Heroes+of+Olympus",
    "coverImage": "https://books.google.com/books/content?id=zQd7DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  },
  {
    "id": "podcast-doac-ryan-holiday",
    "type": "podcast",
    "title": "The Discipline Expert - Ryan Holiday",
    "authorOrHost": "The Diary of a CEO with Steven Bartlett",
    "status": "completed",
    "link": "https://www.youtube.com/results?search_query=diary+of+a+ceo+ryan+holiday",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/69/af/0d/69af0ddd-1e0f-7ae3-c84b-88f18e31ad0c/mza_14445920128472365296.png/600x600bb.jpg"
  },
  {
    "id": "podcast-doac-anna-lembke-dopamine",
    "type": "podcast",
    "title": "The Dopamine Expert (Anna Lembke)",
    "authorOrHost": "The Diary of a CEO with Steven Bartlett",
    "status": "completed",
    "link": "https://www.youtube.com/results?search_query=diary+of+a+ceo+anna+lembke+dopamine",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/69/af/0d/69af0ddd-1e0f-7ae3-c84b-88f18e31ad0c/mza_14445920128472365296.png/600x600bb.jpg"
  },
  {
    "id": "podcast-doac-morgan-housel-savings",
    "type": "podcast",
    "title": "The Savings Expert (Morgan Housel)",
    "authorOrHost": "The Diary of a CEO with Steven Bartlett",
    "status": "completed",
    "link": "https://www.youtube.com/results?search_query=diary+of+a+ceo+morgan+housel",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/69/af/0d/69af0ddd-1e0f-7ae3-c84b-88f18e31ad0c/mza_14445920128472365296.png/600x600bb.jpg"
  },
  {
    "id": "podcast-potterless",
    "type": "podcast",
    "title": "Potterless",
    "authorOrHost": "Mike Schubert",
    "status": "completed",
    "link": "https://open.spotify.com/show/5u9XwKfA8s0KTL6Z7N8Q6m",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/57/f9/2f/57f92f1f-f97a-9e74-0003-4867e3a6fe62/mza_6050806282556514841.jpeg/600x600bb.jpg"
  },
  {
    "id": "podcast-ai-daily-brief",
    "type": "podcast",
    "title": "The AI Daily Brief",
    "authorOrHost": "NLW",
    "status": "paused",
    "link": "https://open.spotify.com/show/4Yh6P6nQ2I6f8NQjXk8qFQ",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/9c/78/d8/9c78d82d-a2d1-a026-6ca2-f92ea61be9ae/mza_18421328158594577747.jpg/600x600bb.jpg"
  },
  {
    "id": "podcast-start-here",
    "type": "podcast",
    "title": "Start Here",
    "authorOrHost": "ABC News",
    "status": "paused",
    "link": "https://open.spotify.com/show/2T7j0S8mLqf6Sk8y7D1v5K",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Podcasts122/v4/2e/b5/e2/2eb5e266-1312-4e77-565d-5f7c28f61b24/mza_4079247101203743703.jpg/600x600bb.jpg"
  },
  {
    "id": "podcast-today-in-focus",
    "type": "podcast",
    "title": "Today in Focus",
    "authorOrHost": "The Guardian",
    "status": "paused",
    "link": "https://open.spotify.com/show/4vQfD7DkQxVYwVj5X2kG1f",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/f1/13/71/f113715f-56e4-f542-a08c-b5890c0841bc/mza_18228009703397905678.jpg/600x600bb.jpg"
  },
  {
    "id": "movie-memento",
    "type": "movie",
    "title": "Memento",
    "authorOrHost": "Christopher Nolan",
    "status": "completed",
    "link": "https://www.google.com/search?q=Memento+movie",
    "coverImage": "https://upload.wikimedia.org/wikipedia/en/c/c7/Memento_poster.jpg"
  },
  {
    "id": "movie-inception",
    "type": "movie",
    "title": "Inception",
    "authorOrHost": "Christopher Nolan",
    "status": "completed",
    "link": "https://www.google.com/search?q=Inception+movie",
    "coverImage": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg"
  },
  {
    "id": "movie-f1",
    "type": "movie",
    "title": "F1",
    "authorOrHost": "Joseph Kosinski",
    "status": "completed",
    "link": "https://www.google.com/search?q=F1+movie",
    "coverImage": "https://posterhubstudio.com/cdn/shop/files/F1LEFILM.jpg"
  },
  {
    "id": "movie-minority-report",
    "type": "movie",
    "title": "Minority Report",
    "authorOrHost": "Steven Spielberg",
    "status": "completed",
    "link": "https://www.google.com/search?q=Minority+Report+movie",
    "coverImage": "https://upload.wikimedia.org/wikipedia/en/4/44/Minority_Report_Poster.jpg?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail_unscaled"
  },
  {
    "id": "show-how-i-met-your-mother",
    "type": "show",
    "title": "How I Met Your Mother",
    "authorOrHost": "Carter Bays & Craig Thomas",
    "status": "completed",
    "link": "https://www.google.com/search?q=How+I+Met+Your+Mother",
    "coverImage": "https://static.wikia.nocookie.net/himym/images/4/46/HIMYM_poster.jpg/revision/latest?cb=20220215204714"
  },
  {
    "id": "show-the-good-place",
    "type": "show",
    "title": "The Good Place",
    "authorOrHost": "Michael Schur",
    "status": "completed",
    "link": "https://www.google.com/search?q=The+Good+Place",
    "coverImage": "https://upload.wikimedia.org/wikipedia/en/8/84/The_Good_Place_season_1.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original"
  },
  {
    "id": "show-the-residence",
    "type": "show",
    "title": "The Residence",
    "authorOrHost": "Paul William Davies",
    "status": "completed",
    "link": "https://www.google.com/search?q=The+Residence+Netflix",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/en/thumb/7/7b/The_Residence_%28TV_series%29.jpg/250px-The_Residence_%28TV_series%29.jpg?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail"
  },
  {
    "id": "podcast-p1-matt-and-tommy",
    "type": "podcast",
    "title": "P1 with Matt & Tommy",
    "authorOrHost": "Matt Gallagher and Tommy Bellingham",
    "status": "consuming",
    "link": "https://open.spotify.com/show/5uHk6u9wQm2uYj8h7N5F7G",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/24/59/3d/24593df5-3a1d-bb1e-b723-c445089853d5/mza_1203789523881052632.jpeg/600x600bb.jpg"
  },
  {
    "id": "podcast-the-newest-olympian",
    "type": "podcast",
    "title": "The Newest Olympian",
    "authorOrHost": "Mike Schubert",
    "status": "consuming",
    "link": "https://open.spotify.com/show/1wU7Vd3Jwq1M6Wm4w3hL7r",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/21/b1/8c/21b18c51-3734-7fdd-8113-b05631c38dc6/mza_3436610707193666304.jpeg/600x600bb.jpg"
  },
  {
    "id": "book-project-hail-mary",
    "type": "book",
    "title": "Project Hail Mary",
    "authorOrHost": "Andy Weir",
    "status": "consuming",
    "link": "https://www.goodreads.com/search?q=Project+Hail+Mary",
    "coverImage": "https://books.google.com/books/content?id=GrYsEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api"
  }
];

import { defineAsyncComponent } from "vue";
const Bookshelf = defineAsyncComponent(() => import("./components/Bookshelf.vue"));
</script>

<Bookshelf :items="bookshelfData" />
