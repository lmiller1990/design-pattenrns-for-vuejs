import { useSlots, defineComponent, h, computed, watchEffect } from "vue";

export const Tab = defineComponent({
  setup() {
    const slots = useSlots() as any;
    return () => h("div", slots.default?.());
  },
});

export const TabContent = defineComponent({
  setup() {
    const slots = useSlots() as any;
    return () => h("div", slots.default?.());
  },
});

export const TabContainer = defineComponent({
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: {
    "update:modelValue": (activeTabId: string) => {
      return true;
      // return typeof activeTabId === 'string'
    },
  },
  setup(props, { emit }) {
    const slots = useSlots() as any;

    const content: Array<typeof Tab | typeof TabContent> =
      slots.default?.() ?? [];

    const tabFilter = (component: any): component is typeof Tab =>
      component.type === Tab;

    const tabs = computed(() =>
      content.filter(tabFilter).map((tab) => {
        return h(tab, {
          class: {
            key: tab.props.tabId,
            tab: true,
            active: tab.props.tabId === props.modelValue,
          },
          onClick: () => {
            emit("update:modelValue", tab.props.tabId);
          },
        });
      })
    );

    const contentFilter = (
      component: any
    ): component is typeof TabContent => {
      return component.type === TabContent &&
      component.props.tabId === props.modelValue;
    }

    const tabContent = computed(() => {
      const slot = content.find(contentFilter)!;
      return h(slot, { key: slot.props.tabId });
    });

    return () => [
      h("div", { class: "tabs" }, tabs.value),
      h("div", { class: "content" }, tabContent.value),
    ];
  },
});
