<template functional>
<td
  :id="props.id"
  :class="{
    validation: true,
    selected: props.selected
  }"
  :style="{
    'border-left': '2px solid ' + props.column.color,
  }"
  @click="listeners.click"
>

  <div class="wrapper">

    <!-- validation tag-->
    <router-link
      :to="{
        name: 'task',
        params: {task_id: props.task.id}
      }"
      class="tag dynamic"
      :style="{
        background: props.backgroundColor,
        color: props.textColor,
      }"
      v-if="props.task"
    >
      {{ props.task.task_status_short_name }}
    </router-link>

    <!-- person avatar-->
    <div class="avatar-list" v-if="props.task && props.showAssignees">
      <span
        :key="props.task.id + '_' + person.id"
        class="avatar has-text-centered"
        :style="{background: person.color}"
        v-for="person in props.task.assigneesInfo"
      >
        {{ person.initials }}
      </span>
    </div>

  </div>
</td>
</template>

<script>
export default {
  name: 'validation-cell',
  props: {
    id: {
      default: '',
      type: String
    },
    column: {
      default: () => {},
      type: Object
    },
    task: {
      default: () => {},
      type: Object
    },
    backgroundColor: {
      default: 'grey',
      type: String
    },
    textColor: {
      default: 'white',
      type: String
    },
    selected: {
      default: false,
      type: Boolean
    },
    showAssignees: {
      default: false,
      type: Boolean
    }
  }
}
</script>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
}

td.validation {
  min-width: 120px;
  max-width: 120px;
  width: 120px;
  cursor: pointer;
  vertical-align: top;
}

td.validation:hover {
  background: #ecfaec;
}

td.selected,
td.selected.validation:hover {
  background: #D1C4E9;
}

.tag {
  flex: 1;
  text-transform: uppercase;
  cursor: default;
  margin-bottom: 3px;
  padding-top: 3px;
  padding-bottom: 3px;
}

.tag.dynamic:hover {
  cursor: pointer;
  transform: scale(1.15);
  transition: all 0.1s ease-in-out
}

.avatar-list {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
}

.avatar img {
  max-height: 100%;
}

.avatar {
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 3px;
  margin-bottom: 3px;
  width: 20px;
  height: 20px;
  font-size: 10px;
  text-align: center;
}

.avatar span {
  flex: 1;
}
</style>
