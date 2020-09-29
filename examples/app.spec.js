import { mount } from '@vue/test-utils'
import App from './App.vue'
import Emitter from './Emitter.vue'

test('app', async () => {
  const wrapper = mount(Emitter) 
  await wrapper.find('input').setValue('Lachlan')
  console.log(wrapper.html())
  console.log(wrapper.emitted())
})
