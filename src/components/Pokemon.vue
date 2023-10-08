<script setup>
import {
  Popover,
  Listbox,
  ListboxLabel,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid'
import { ref, computed, watch } from 'vue'
import { useApolloClient } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
const { client } = useApolloClient()
// import GET_POKEMON from '../graphql/randomPokemon.query.gql'

const gens = [
  { name: 'All', range: { min: 1, max: 1013 } },
  { name: '1', range: { min: 1, max: 151 } },
  { name: '2', range: { min: 152, max: 251 } },
  { name: '3', range: { min: 252, max: 386 } },
  { name: '4', range: { min: 387, max: 493 } },
  { name: '5', range: { min: 494, max: 649 } },
  { name: '6', range: { min: 650, max: 721 } },
  { name: '7', range: { min: 722, max: 809 } },
  { name: '8', range: { min: 810, max: 905 } },
  { name: '9', range: { min: 906, max: 1013 } }
];
const selectedGeneration = ref(null)
const generationSelected = ref(true)
const correctAnswers = ref(0)
const randomNumbersCorrect = ref([])
const randomNumbersIncorrect = ref([])
const correctPokemon = ref([])
const incorrectPokemon = ref([])
const games = ref([])
const gameNumber = ref(0)
const disableWrongAnswer = ref([])
const gameOn = ref(false)
const displayGuessResult = ref(null)
const open = ref(false)
const showPokemon = ref(false)

//Query

const GET_POKEMON = gql`query GetPokemon($dexIds: [Int!]) {
    species: pokemon_v2_pokemonspecies(where: { id: { _in: $dexIds } }) {
      name
      id
    }
  }`

const loadPokemon = async () => {
  const { data } = await client.query({
    query: GET_POKEMON,
    variables: {
      dexIds: [...randomNumbersCorrect.value, ...randomNumbersIncorrect.value]
    }
  })
  console.log(data)
  const allPokemonData = data.species;
  correctPokemon.value = randomNumbersCorrect.value.map(num => allPokemonData.find(p => p.id === num));
  incorrectPokemon.value = randomNumbersIncorrect.value.map(num => allPokemonData.find(p => p.id === num));
}

// Function to shuffle array
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

//Create 5 games of four arrays - shuffled
const loadGames = () => {
  if (correctPokemon.value.length) {
    for (let i = 0; i < 5; i++) {
      const game = [correctPokemon.value[i], ...incorrectPokemon.value.slice(i * 3, i * 3 + 3)];
      games.value = [...games.value, game]
    }
    games.value = games.value.map(game => shuffleArray(game));
  }
}

// Get range for selected generation
const selectedGenerationRange = computed(() => selectedGeneration.value ? selectedGeneration.value.range : null);

// Based on generation selected, create random numbers
const resetAndGenerateRandomNumbers = () => {
  if (!selectedGenerationRange.value) {
    generationSelected.value = false;
    return;
  }
  generationSelected.value = true;
  randomNumbersCorrect.value = [];
  randomNumbersIncorrect.value = [];

  const { min, max } = selectedGenerationRange.value;
  const randomNumbersSet = new Set();

  while (randomNumbersSet.size < 20) {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    randomNumbersSet.add(randomNumber);
  }

  randomNumbersCorrect.value = Array.from(randomNumbersSet).slice(0, 5);
  randomNumbersIncorrect.value = Array.from(randomNumbersSet).slice(5);

};

//AAAAND GO
const startGame = async () => {
  gameOn.value = true
  resetAndGenerateRandomNumbers()

  await loadPokemon()

  loadGames()

}

// Gameplay
const checkAnswer = (pokeId) => {
  if (randomNumbersCorrect.value.includes(pokeId)) {
    showPokemon.value = true
    correctAnswers.value++
    disableWrongAnswer.value = []
    displayGuessResult.value = 'CORRECT!';

    setTimeout(() => {
      gameNumber.value++
      displayGuessResult.value = null
      showPokemon.value = false
    }, 2000);
  } else if (disableWrongAnswer.value.length < 2) {
    displayGuessResult.value = 'NOPE! TRY AGAIN!'
    disableWrongAnswer.value = [...disableWrongAnswer.value, pokeId]
    setTimeout(() => {
      displayGuessResult.value = null;
    }, 800);
  } else {
    displayGuessResult.value = 'Welp, you tried!'
    setTimeout(() => {
      disableWrongAnswer.value = []
      displayGuessResult.value = null;
      gameNumber.value++
    }, 2000);
  }
}

const isGameOver = computed(() => gameNumber.value >= games.value.length)

watch(isGameOver, (newValue) => {
  if (newValue) {
    open.value = true;
  }
})

const restartGame = () => {
  // Reset state
  selectedGeneration.value = null
  generationSelected.value = true
  correctAnswers.value = 0
  randomNumbersCorrect.value = []
  randomNumbersIncorrect.value = []
  correctPokemon.value = []
  incorrectPokemon.value = []
  games.value = []
  gameNumber.value = 0
  disableWrongAnswer.value = []
  gameOn.value = false
  displayGuessResult.value = null
  open.value = false
}

// Work on  random scoring :), further refine styles and transitions

</script>

<template>
  <div class="min-h-full">
    <Popover as="header" class="bg-gradient-to-b from-sky-500 to-indigo-500 pb-32">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <div class="relative flex items-center py-5 justify-between">
          <!-- Logo -->
          <div class="">
            <a href="#">
              <span class="sr-only">Who's That Pokémon!?</span>
              <img class="h-12 w-auto" src="../assets/pika.png" alt="Pokémon" />
            </a>
          </div>

          <h1 class="text-2xl md:text-4xl font-bold text-white">Who's That Pokémon?!?</h1>

          <div class="">
            <div class="text-xl md:text-2xl font-bold text-white">
              <span class="mb-1">{{ correctAnswers }}</span>
              <span class="mt-1"> / 5</span>
            </div>
          </div>
        </div>
      </div>
    </Popover>
    <main class="-mt-24 pb-8">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 class="sr-only">Who's That Pokémon</h1>
        <!-- Main 3 column grid -->
        <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
          <!-- Left column -->
          <div class="grid grid-cols-1 gap-4 lg:col-span-2">
            <section aria-labelledby="section-1-title">
              <h2 class="sr-only" id="section-1-title">Pokemon Display</h2>
              <!-- bg-[url('../assets/bg.png')] bg-contain bg-top bg-no-repeat h-52 sm:h-[320px] md:h-[400px] lg:h-[320px] xl:h-[420px] -->
              <div class="overflow-hidden rounded-lg shadow relative">
                <div class="">
                  <img src="../assets/bg.png" alt="Who's that Pokemon background">
                  <img v-if="!isGameOver" class="pointer-events-none w-1/2 absolute left-0 inset-y-0"
                    :class="showPokemon ? 'brightness-100' : 'brightness-0'"
                    :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${randomNumbersCorrect[ gameNumber ]}.png`"
                    alt="">
                </div>
              </div>
            </section>
            <!-- LISTBOX  ----------------------------------------------- ----------------------------------------------- --------------- -->
            <div class="flex justify-center items-center gap-4 pt-4 lg:pt-8">
              <!-- SELECT GENERATION -->
              <div class="flex-grow max-w-xs z-10">
                <Listbox as="div" v-model="selectedGeneration">
                  <label class="sr-only">Select a Generation
                  </label>
                  <div class="relative">
                    <ListboxButton
                      class="relative w-full cursor-default rounded-md bg-white/50 py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      :class="generationSelected ? '' : 'ring-red-600'" :disabled="generationSelected && gameOn">
                      <span class="block truncate">{{ !selectedGeneration ? 'Select a Generation' : `Generation:
                        ${selectedGeneration.name}` }}</span>
                      <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </span>
                    </ListboxButton>

                    <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100"
                      leave-to-class="opacity-0">
                      <ListboxOptions
                        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        <ListboxOption as="template" v-for="gen in gens" :key="gen.name" :value="gen"
                          v-slot="{ active, selected }">
                          <li
                            :class="[ active ? 'bg-indigo-600 text-white' : 'text-gray-900', 'relative cursor-default select-none py-2 pl-3 pr-9' ]">
                            <span :class="[ selected ? 'font-semibold' : 'font-normal', 'block truncate' ]">{{ gen.name
                            }}</span>

                            <span v-if="selected"
                              :class="[ active ? 'text-white' : 'text-indigo-600', 'absolute inset-y-0 right-0 flex items-center pr-4' ]">
                              <CheckIcon class="h-5 w-5" aria-hidden="true" />
                            </span>
                          </li>
                        </ListboxOption>
                      </ListboxOptions>
                    </transition>
                  </div>
                </Listbox>
              </div>
              <button @click="startGame" :disabled="generationSelected && gameOn"
                class="py-2 px-6 bg-emerald-500 text-white rounded-md"
                :class="{ 'bg-emerald-500 text-gray opacity-60': gameOn }">START</button>
            </div>
            <!-- <span v-if="selectedGeneration">{{ selectedGeneration.range.max }}</span>
            <span v-if="randomNumbersIncorrect">{{ randomNumbersIncorrect }}</span>
            <span v-if="randomNumbersCorrect">{{ randomNumbersCorrect }}</span>
            <span v-if="correctPokemon" v-for="pokemon in correctPokemon">{{ pokemon.name }} - {{ pokemon.id }}</span>
            <span v-if="incorrectPokemon" v-for="pokemon in incorrectPokemon">{{ pokemon.name }} - {{ pokemon.id }}</span> -->
          </div>

          <!-- Right column -->
          <div class="grid md:grid-cols-1 gap-4">
            <section aria-labelledby="section-2-title">
              <h2 class="sr-only" id="section-2-title">Section title</h2>
              <div class="rounded-lg bg-white shadow h-60 lg:h-[400px]">
                <div class="p-6 space-y-5 flex flex-col items-center justify-center">
                  <h2>Who's That Pokémon???</h2>
                  <div class="grid grid-cols-2 lg:grid-cols-1 w-full gap-5">
                    <button v-for="poke in games[ gameNumber ]" :key="poke.id" @click="checkAnswer(poke.id)"
                      :disabled="disableWrongAnswer.length && disableWrongAnswer.includes(poke.id)"
                      class="w-full rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 text-sm font-medium text-gray-900"
                      :class="{ 'border-red-500 opacity-70': disableWrongAnswer.includes(poke.id) }">
                      {{ poke.name.toUpperCase() }}
                    </button>
                  </div>
                  <h2 class="font-bold text-3xl" :class="[ { 'hidden': !displayGuessResult }, {
                    'block text-green-500': displayGuessResult
                  }, {
                    'block text-red-500':
                      displayGuessResult && disableWrongAnswer.length
                  }, ]">{{ displayGuessResult }}</h2>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
    <TransitionRoot as="template" :show="open">
      <Dialog as="div" class="relative z-10" @close="open = false">
        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
          leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild as="template" enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <DialogPanel
                class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div class="mx-auto flex items-center justify-center">
                    <span class="text-2xl font-bold text-gray-900">{{ correctAnswers }} / 5</span>
                  </div>
                  <div class="mt-3 text-center sm:mt-5">
                    <DialogTitle as="h3" class="text-base font-semibold leading-6 text-gray-900">Way to go!
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500">Lorem ipsum, dolor sit amet consectetur adipisicing elit. Eius
                        aliquam laudantium explicabo pariatur iste dolorem animi vitae error totam. At sapiente aliquam
                        accusamus facere veritatis.</p>
                    </div>
                  </div>
                </div>
                <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button type="button"
                    class="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 sm:col-start-2"
                    @click="restartGame">Play Again!</button>
                  <button type="button"
                    class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    @click="open = false" ref="cancelButtonRef">Cancel</button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
    <footer>
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <div class="border-t border-gray-200 py-8 text-center text-sm text-gray-500 sm:text-left"><span
            class="block sm:inline">&copy; <a href="https://ryanjones.dev" target="_blank" class="block sm:inline">Ryan
              Jones</a></span>
        </div>
      </div>
    </footer>
  </div>
</template>

