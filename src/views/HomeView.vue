<script setup lang="ts"></script>

<template>
  <div class="home-container">
    <h1>パス一覧</h1>
    <nav>
      <ul class="path-list">
        <li>
          <router-link to="/">パス一覧</router-link>
        </li>
        <li>
          <router-link to="/text-width-comparison">文字幅比較</router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.path-list {
  list-style: none;
  padding: 0;
}

.path-list li {
  margin-bottom: 1rem;
}

.path-list a {
  display: block;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  text-decoration: none;
  color: #2c3e50;
  transition: background-color 0.3s ease;
}

.path-list a:hover {
  background-color: #e0e0e0;
}

.path-list a.router-link-active {
  background-color: #42b983;
  color: white;
}
</style>
