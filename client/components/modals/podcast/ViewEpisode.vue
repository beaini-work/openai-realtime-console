<template>
  <modals-modal v-model="show" name="podcast-episode-view-modal" :width="800" :height="'unset'" :processing="processing">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3 overflow-hidden">
        <p class="text-3xl text-white truncate">{{ $strings.LabelEpisode }}</p>
      </div>
    </template>
    <div ref="wrapper" class="p-4 w-full text-sm rounded-lg bg-bg shadow-lg border border-black-300 relative overflow-y-auto" style="max-height: 80vh">
      <div class="flex mb-4">
        <div class="w-12 h-12">
          <covers-book-cover :library-item="libraryItem" :width="48" :book-cover-aspect-ratio="bookCoverAspectRatio" />
        </div>
        <div class="flex-grow px-2">
          <p class="text-base mb-1">{{ podcastTitle }}</p>
          <p class="text-xs text-gray-300">{{ podcastAuthor }}</p>
        </div>
      </div>
      <p dir="auto" class="text-lg font-semibold mb-6">{{ title }}</p>
      <div v-if="description" dir="auto" class="default-style less-spacing" v-html="description" />
      <p v-else class="mb-2">{{ $strings.MessageNoDescription }}</p>

      <div class="w-full h-px bg-white/5 my-4" />

      <div class="flex items-center">
        <div class="flex-grow">
          <p class="font-semibold text-xs mb-1">{{ $strings.LabelFilename }}</p>
          <p class="mb-2 text-xs">
            {{ audioFileFilename }}
          </p>
        </div>
        <div class="flex-grow">
          <p class="font-semibold text-xs mb-1">{{ $strings.LabelSize }}</p>
          <p class="mb-2 text-xs">
            {{ audioFileSize }}
          </p>
        </div>
        <div class="flex-shrink-0 ml-4">
          <ui-btn v-if="!isTranscribing && !hasTranscript" @click="transcribeEpisode" :loading="isTranscribing">
            <span class="material-symbols mr-2">record_voice_over</span>
            Transcribe
          </ui-btn>
          <ui-btn v-else-if="hasTranscript" @click="viewTranscript" variant="secondary">
            <span class="material-symbols mr-2">description</span>
            View Transcript
          </ui-btn>
          <ui-btn v-else disabled>
            <span class="material-symbols mr-2 animate-spin">refresh</span>
            Transcribing...
          </ui-btn>
        </div>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  data() {
    return {
      processing: false,
      isTranscribing: false
    }
  },
  computed: {
    show: {
      get() {
        return this.$store.state.globals.showViewPodcastEpisodeModal
      },
      set(val) {
        this.$store.commit('globals/setShowViewPodcastEpisodeModal', val)
      }
    },
    libraryItem() {
      return this.$store.state.selectedLibraryItem
    },
    episode() {
      return this.$store.state.globals.selectedEpisode || {}
    },
    episodeId() {
      return this.episode.id
    },
    title() {
      return this.episode.title || 'No Episode Title'
    },
    description() {
      return this.episode.description || ''
    },
    media() {
      return this.libraryItem?.media || {}
    },
    mediaMetadata() {
      return this.media.metadata || {}
    },
    podcastTitle() {
      return this.mediaMetadata.title
    },
    podcastAuthor() {
      return this.mediaMetadata.author
    },
    audioFileFilename() {
      return this.episode.audioFile?.metadata?.filename || ''
    },
    audioFileSize() {
      const size = this.episode.audioFile?.metadata?.size || 0

      return this.$bytesPretty(size)
    },
    bookCoverAspectRatio() {
      return this.$store.getters['libraries/getBookCoverAspectRatio']
    },
    hasTranscript() {
      return this.episode.transcript != null
    }
  },
  methods: {
    async transcribeEpisode() {
      try {
        this.isTranscribing = true
        await this.$axios.$post(`/api/podcasts/${this.libraryItem.id}/episode/${this.episodeId}/transcribe`)
        this.$toast.success('Transcription started')
      } catch (error) {
        console.error('Failed to start transcription', error)
        this.$toast.error(error.response?.data || 'Failed to start transcription')
      } finally {
        this.isTranscribing = false
      }
    },
    viewTranscript() {
      // TODO: Implement transcript viewing modal
      this.$store.commit('globals/setShowTranscriptModal', {
        libraryItem: this.libraryItem,
        episode: this.episode
      })
    }
  },
  mounted() {}
}
</script>
