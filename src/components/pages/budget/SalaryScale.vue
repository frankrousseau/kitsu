<template>
  <page-layout :side="false">
    <template #main>
      <div class="flexcolumn page">
        <page-title class="mt1" :text="$t('budget.salary_scale_title')" />
        <div class="has-text-centered" v-if="isLoading">
          <spinner />
        </div>
        <div class="data-list desktop-only" v-else>
          <div class="datatable-wrapper">
            <table class="datatable">
              <thead class="datatable-head">
                <tr>
                  <th>{{ $t('budget.fields.department') }}</th>
                  <th>{{ $t('budget.fields.seniority') }}</th>
                  <th>{{ $t('budget.fields.position') }}</th>
                  <th>{{ $t('budget.fields.base_salary') }}</th>
                </tr>
              </thead>

              <tbody class="datatable-body">
                <template
                  :key="department.id"
                  v-for="department in departments"
                >
                  <tr class="datatable-row">
                    <td rowspan="9">
                      <department-name :department="department" />
                    </td>
                    <td rowspan="3">{{ $t('budget.positions.supervisor') }}</td>
                    <td>{{ $t('budget.seniorities.senior') }}</td>
                    <td>
                      <input
                        type="number"
                        class="input-editor"
                        @input="
                          value =>
                            modifySalaryScale(
                              department.id,
                              'supervisor',
                              'senior',
                              value
                            )
                        "
                        :value="
                          salaryScale[department.id]?.supervisor.senior
                            .salary || 0
                        "
                      />
                    </td>
                  </tr>
                  <tr class="datatable-row">
                    <td>{{ $t('budget.seniorities.mid') }}</td>
                    <td>
                      <input
                        type="number"
                        class="input-editor"
                        @input="
                          value =>
                            modifySalaryScale(
                              department.id,
                              'supervisor',
                              'mid',
                              value
                            )
                        "
                        :value="
                          salaryScale[department.id]?.supervisor.mid.salary || 0
                        "
                      />
                    </td>
                  </tr>
                  <tr class="datatable-row">
                    <td>{{ $t('budget.seniorities.junior') }}</td>
                    <td>
                      <input
                        type="number"
                        class="input-editor"
                        @input="
                          value =>
                            modifySalaryScale(
                              department.id,
                              'supervisor',
                              'junior',
                              value
                            )
                        "
                        :value="
                          salaryScale[department.id]?.supervisor.junior
                            .salary || 0
                        "
                      />
                    </td>
                  </tr>
                  <tr class="datatable-row">
                    <td rowspan="3">{{ $t('budget.positions.lead') }}</td>
                    <td>{{ $t('budget.seniorities.senior') }}</td>
                    <td>
                      <input
                        type="number"
                        class="input-editor"
                        @input="
                          value =>
                            modifySalaryScale(
                              department.id,
                              'lead',
                              'senior',
                              value
                            )
                        "
                        :value="
                          salaryScale[department.id]?.lead.senior.salary || 0
                        "
                      />
                    </td>
                  </tr>
                  <tr class="datatable-row">
                    <td>{{ $t('budget.seniorities.mid') }}</td>
                    <td>
                      <input
                        type="number"
                        class="input-editor"
                        @input="
                          value =>
                            modifySalaryScale(
                              department.id,
                              'lead',
                              'mid',
                              value
                            )
                        "
                        :value="
                          salaryScale[department.id]?.lead.mid.salary || 0
                        "
                      />
                    </td>
                  </tr>
                  <tr class="datatable-row">
                    <td>{{ $t('budget.seniorities.junior') }}</td>
                    <td>
                      <input
                        type="number"
                        class="input-editor"
                        @input="
                          value =>
                            modifySalaryScale(
                              department.id,
                              'lead',
                              'junior',
                              value
                            )
                        "
                        :value="
                          salaryScale[department.id]?.lead.junior.salary || 0
                        "
                      />
                    </td>
                  </tr>
                  <tr class="datatable-row">
                    <td rowspan="3">{{ $t('budget.positions.artist') }}</td>
                    <td>{{ $t('budget.seniorities.senior') }}</td>
                    <td>
                      <input
                        type="number"
                        class="input-editor"
                        @input="
                          value =>
                            modifySalaryScale(
                              department.id,
                              'artist',
                              'senior',
                              value
                            )
                        "
                        :value="
                          salaryScale[department.id]?.artist.senior.salary || 0
                        "
                      />
                    </td>
                  </tr>
                  <tr class="datatable-row">
                    <td>{{ $t('budget.seniorities.mid') }}</td>
                    <td>
                      <input
                        type="number"
                        class="input-editor"
                        @input="
                          value =>
                            modifySalaryScale(
                              department.id,
                              'artist',
                              'mid',
                              value
                            )
                        "
                        :value="
                          salaryScale[department.id]?.artist.mid.salary || 0
                        "
                      />
                    </td>
                  </tr>
                  <tr class="datatable-row">
                    <td>{{ $t('budget.seniorities.junior') }}</td>
                    <td>
                      <input
                        type="number"
                        class="input-editor"
                        @input="
                          value =>
                            modifySalaryScale(
                              department.id,
                              'artist',
                              'junior',
                              value
                            )
                        "
                        :value="
                          salaryScale[department.id]?.artist.junior.salary || 0
                        "
                      />
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mobile-list" v-if="!isLoading">
          <div
            class="department-card"
            v-for="department in departments"
            :key="department.id"
          >
            <h3 class="department-header">
              <department-name :department="department" no-padding />
            </h3>
            <div
              class="position-block"
              v-for="position in positions"
              :key="position"
            >
              <h4 class="position-header">
                {{ $t(`budget.positions.${position}`) }}
              </h4>
              <div
                class="seniority-row"
                v-for="seniority in seniorities"
                :key="seniority"
              >
                <label class="seniority-label">
                  {{ $t(`budget.seniorities.${seniority}`) }}
                </label>
                <input
                  type="number"
                  class="input-editor"
                  @input="
                    event =>
                      modifySalaryScale(
                        department.id,
                        position,
                        seniority,
                        event
                      )
                  "
                  :value="
                    salaryScale[department.id]?.[position][seniority].salary ||
                    0
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </page-layout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'

import PageLayout from '@/components/layouts/PageLayout.vue'
import DepartmentName from '@/components/widgets/DepartmentName.vue'
import PageTitle from '@/components/widgets/PageTitle.vue'
import Spinner from '@/components/widgets/Spinner.vue'

const store = useStore()

// State

const isLoading = ref(false)
const positions = ['supervisor', 'lead', 'artist']
const salaryScale = ref({})
const seniorities = ['senior', 'mid', 'junior']

// Computed

const departments = computed(() => store.getters.departments)

// Functions

const setSalaryScale = async () => {
  isLoading.value = true
  salaryScale.value = await store.dispatch('loadSalaryScale')
  isLoading.value = false
}

const modifySalaryScale = (departmentId, position, seniority, event) => {
  const salary = Math.trunc(event.target.valueAsNumber || 0)
  const scaleEntry = salaryScale.value[departmentId][position][seniority]
  scaleEntry.salary = salary
  store.dispatch('updateSalaryScale', scaleEntry)
}

// Lifecycle

onMounted(setSalaryScale)
</script>

<style lang="scss" scoped>
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
}

// Make the desktop table fill the full content width — the global
// `.datatable` rule is `width: auto`, which leaves big empty space on
// the right with this narrow column set.
.desktop-only :deep(.datatable) {
  width: 100%;
}

.mobile-list {
  display: none;
}

.department-card {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 1em;
  padding: 1em;
}

.dark .department-card {
  background: var(--background-alt);
}

.department-header {
  font-size: 1.05em;
  font-weight: 600;
  margin: 0 0 1em;
}

.position-block + .position-block {
  margin-top: 0.75em;
  padding-top: 0.75em;
  border-top: 1px solid var(--border);
}

.position-header {
  color: var(--text-alt);
  font-size: 0.85em;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin: 0 0 0.4em;
  text-transform: uppercase;
}

.seniority-row {
  align-items: center;
  display: flex;
  gap: 0.75em;
  margin-bottom: 0.4em;
}

.seniority-label {
  color: var(--text);
  flex: 0 0 5em;
  font-size: 0.95em;
}

// Match the global `td .input-editor` styling — the mobile rendering
// places inputs inside divs, not table cells, so those rules don't reach.
.seniority-row .input-editor {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  flex: 1;
  height: 2.25em;
  min-width: 0;
  padding: 0.4em 0.6em;
  text-align: right;

  &:hover {
    border-color: $light-green;
  }

  &:active,
  &:focus {
    border-color: $green;
    outline: none;
  }
}

@media screen and (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-list {
    display: block;
    padding: 0 0.5em;
  }

  .page :deep(.title) {
    margin-bottom: 1em;
  }
}
</style>
