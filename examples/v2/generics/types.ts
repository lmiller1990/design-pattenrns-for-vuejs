import { defineComponent, h, ref } from "vue";

export interface ListItem {
  id: string;
  title: string;
}

const Comp = defineComponent(
  // TODO: babel plugin to auto infer runtime props options from type
  // similar to defineProps<{...}>()
  <T extends ListItem>(props: { msg: T; list: T[] }) => {
    // use Composition API here like in <script setup>
    const count = ref(0);

    return () => h("div", props.msg.);
  }
);
