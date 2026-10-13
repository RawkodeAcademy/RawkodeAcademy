<template>
	<div :class="s.root">
		<p role="status" aria-live="polite" aria-atomic="true" :class="ready ? s.hidden : s.copy">{{ statusMessage }}</p>
		<p :id="errorId" role="alert" aria-atomic="true" :class="error ? s.error : s.hidden">{{ error }}</p>
		<p v-if="fallback" :class="s.copy">
			<a :href="fallbackMailto">Email David directly</a> with the details you entered.
		</p>
		<div v-if="submitted" :class="[s.panel, s.status]">
			<h3 :class="s.heading">Enquiry received</h3>
			<p :class="s.copy">David reads every enquiry and replies within two business days.</p>
		</div>
		<form v-else method="POST" :class="s.form" @submit.prevent="submit" :aria-busy="!ready || loading" :aria-describedby="error ? errorId : undefined">
			<fieldset :class="[s.form, 'form-controls']" :disabled="!ready || loading" aria-label="First-run review enquiry" @focusin="trackStarted">
				<input type="hidden" name="path" :value="path" />
				<div class="form-honeypot" aria-hidden="true">
					<label :for="honeypotId">Website</label>
					<input
						:id="honeypotId"
						v-model="website"
						type="text"
						name="website"
						tabindex="-1"
						autocomplete="off"
					/>
				</div>
				<div :class="s.row">
					<Field.Root :class="s.field" :invalid="Boolean(fieldErrors.name)" :disabled="loading">
						<Field.Label :class="s.label">Name</Field.Label>
						<Field.Input :class="s.input"
							v-model="name"
							type="text"
							name="name"
							autocomplete="name"
							required
						/>
						<Field.ErrorText v-if="fieldErrors.name" :class="s.fieldError">{{ fieldErrors.name }}</Field.ErrorText>
					</Field.Root>
					<Field.Root :class="s.field" :invalid="Boolean(fieldErrors.email)" :disabled="loading">
						<Field.Label :class="s.label">Work email</Field.Label>
						<Field.Input :class="s.input"
							v-model="email"
							type="email"
							name="email"
							autocomplete="email"
							required
						/>
						<Field.ErrorText v-if="fieldErrors.email" :class="s.fieldError">{{ fieldErrors.email }}</Field.ErrorText>
					</Field.Root>
				</div>

				<Field.Root :class="s.field" :invalid="Boolean(fieldErrors.company)" :disabled="loading">
					<Field.Label :class="s.label">Company</Field.Label>
					<Field.Input :class="s.input"
						v-model="company"
						type="text"
						name="company"
						autocomplete="organization"
						required
					/>
					<Field.ErrorText v-if="fieldErrors.company" :class="s.fieldError">{{ fieldErrors.company }}</Field.ErrorText>
				</Field.Root>

				<Field.Root :class="s.field" :invalid="Boolean(fieldErrors.message)" :disabled="loading">
					<Field.Label :class="s.label">Message</Field.Label>
					<Field.Textarea :class="[s.input, s.textarea]"
						v-model="message"
						name="message"
						rows="4"
						required
					/>
					<Field.ErrorText v-if="fieldErrors.message" :class="s.fieldError">{{ fieldErrors.message }}</Field.ErrorText>
				</Field.Root>

				<button type="submit" :class="s.button" :disabled="loading">
					{{ loading ? "Sending enquiry..." : "Send enquiry" }}
				</button>
			</fieldset>
			<p v-if="!ready" :class="s.copy"><noscript>JavaScript is required to send this enquiry. </noscript>You can <a href="mailto:david@rawkode.academy">email us directly</a> instead.</p>
		</form>
	</div>
</template>

<script setup lang="ts">
import { actions, isInputError } from "astro:actions";
import { Field } from "@ark-ui/vue/field";
import { academyForms } from "@rawkodeacademy/design-system";
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import {
	type ApplicationPath,
	applicationPaths,
	resolveApplicationPath,
} from "@/lib/partnerships";

const s = academyForms();
const errorId = `${useId()}-error`;
const honeypotId = `${useId()}-website`;

const FALLBACK_ERROR =
	"We could not send your enquiry. Please email david@rawkode.academy directly.";

const name = ref("");
const email = ref("");
const company = ref("");
const path = ref<ApplicationPath>("Not sure yet");
const message = ref("");
const website = ref("");

const ready = ref(false);
const loading = ref(false);
const submitted = ref(false);
const formStarted = ref(false);
const fallback = ref(false);
const error = ref("");
const fieldErrors = ref<Record<string, string>>({});
const fallbackMailto = computed(() => {
	const subject = encodeURIComponent("First-run review enquiry");
	const body = encodeURIComponent(
		[
			`Name: ${name.value}`,
			`Email: ${email.value}`,
			`Company: ${company.value}`,
			`Help requested: ${path.value}`,
			"",
			message.value,
		].join("\n"),
	);
	return `mailto:david@rawkode.academy?subject=${subject}&body=${body}`;
});
const statusMessage = computed(() => {
	if (!ready.value) return "Loading enquiry form...";
	if (submitted.value)
		return "Enquiry received. David reads every enquiry and replies within two business days.";
	return loading.value ? "Sending enquiry..." : "";
});

const isApplicationPath = (value: string): value is ApplicationPath =>
	(applicationPaths as readonly string[]).includes(value);

const onDocumentClick = (event: MouseEvent) => {
	const target = event.target as HTMLElement | null;
	const trigger = target?.closest<HTMLElement>("[data-apply-path]");
	const value = trigger?.dataset.applyPath;
	if (value && isApplicationPath(value)) {
		path.value = value;
	}
};

onMounted(() => {
	ready.value = true;
	const route = resolveApplicationPath(
		new URLSearchParams(window.location.search).get("route"),
	);
	if (route) {
		path.value = route;
	}
	document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
	document.removeEventListener("click", onDocumentClick);
});

const capturePartnershipEvent = (event: string) => {
	window.posthog?.capture(event, {
		form: "partnership_enquiry",
		path: window.location.pathname,
		route: path.value,
	});
};

const trackStarted = (event: FocusEvent) => {
	const target = event.target as HTMLElement | null;
	if (
		formStarted.value ||
		!target?.matches("input:not([type='hidden']), textarea")
	) {
		return;
	}
	formStarted.value = true;
	capturePartnershipEvent("partnership_form_started");
};

async function submit() {
	if (!ready.value || loading.value) return;
	error.value = "";
	fieldErrors.value = {};
	fallback.value = false;
	loading.value = true;

	try {
		const result = await actions.partnership.apply({
			name: name.value,
			email: email.value,
			company: company.value,
			path: path.value,
			message: message.value,
			website: website.value,
		});

		if (result.error) {
			if (isInputError(result.error)) {
				fieldErrors.value = Object.fromEntries(
					Object.entries(result.error.fields).map(([field, messages]) => [
						field,
						messages?.[0] ?? "Please check this field",
					]),
				);
				error.value = "Please check the highlighted fields.";
			} else {
				error.value = result.error.message || FALLBACK_ERROR;
			}
		} else if (result.data?.success) {
			submitted.value = true;
			if (result.data.accepted !== false) {
				capturePartnershipEvent("partnership_form_submitted");
			}
		} else if (result.data?.rateLimited) {
			error.value =
				"Too many enquiries were sent recently. Please wait a minute and try again.";
		} else {
			fallback.value = true;
			error.value =
				"Attio is not available, so your enquiry was not sent automatically.";
		}
	} catch {
		fallback.value = true;
		error.value = FALLBACK_ERROR;
	} finally {
		loading.value = false;
	}
}
</script>

<style scoped>
.form-controls {
	margin: 0;
	padding: 0;
	border: 0;
	min-inline-size: 0;
}

.form-honeypot {
	position: absolute;
	inset-inline-start: -100vw;
	inline-size: 1px;
	block-size: 1px;
	overflow: hidden;
}
</style>
