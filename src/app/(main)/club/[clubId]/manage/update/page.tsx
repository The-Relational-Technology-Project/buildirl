"use client";

import {
  Club,
  UpdateClubInput,
  UpdateClubInputSchema
} from "~/server/club/types";
import { api } from "~/trpc/react";
import {
  Button,
  Stack,
  Textarea,
  TextInput,
  Title,
  Box,
  useMatches
} from "@mantine/core";
import EditableClubImage from "~/client/components/EditableClubImage";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import ThemeSelector from "~/app/(main)/club/[clubId]/manage/update/_components/ThemeSelector";
import ClubImageUploader from "~/app/(main)/club/[clubId]/manage/update/_components/ClubDisplayImageUpload";
import FontSelector from "~/app/(main)/club/[clubId]/manage/update/_components/FontSelector";
import FAQsSection from "~/app/(main)/club/[clubId]/manage/update/_components/FAQsSection";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PrefixedInput from "~/client/components/PrefixedInput";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";
import LocationSelect from "~/client/components/LocationSelect";
import { City } from "~/server/club/types/location";

function BasicInfoSection() {
  const {
    register,
    formState: { errors }
  } = useFormContext<UpdateClubInput>();

  return (
    <Stack gap={8}>
      <TextInput
        required
        placeholder="Club name"
        {...register("name")}
        error={errors.name?.message}
      />
      <TextInput
        placeholder="Tag line"
        {...register("tagLine")}
        error={errors.tagLine?.message}
      />
      <Textarea
        placeholder="About your club"
        {...register("description")}
        rows={6}
        error={errors.description?.message}
      />
    </Stack>
  );
}

function LocationSection() {
  const {
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useFormContext<UpdateClubInput>();
  const location = watch("location");
  return (
    <Stack gap={8}>
      <Title order={6}>Location</Title>
      <LocationSelect
        value={location}
        // even though we by-pass the type check for null, null value
        // will still trigger the proper react-hook-form validation
        onChange={async (value) => {
          setValue("location", value!);
          await trigger("location");
        }}
        error={errors.location?.message}
      />
    </Stack>
  );
}

function LinksSection() {
  const {
    register,
    formState: { errors }
  } = useFormContext<UpdateClubInput>();

  return (
    <Stack gap={8}>
      <Title order={6}>Club Social Links</Title>
      <TextInput
        placeholder="Website link"
        {...register("websiteUrl")}
        error={errors.websiteUrl?.message}
      />
      <Stack gap={4}>
        <PrefixedInput
          prefix="instagram.com/"
          placeholder="username"
          {...register("instagramHandle")}
          error={errors.instagramHandle?.message}
        />
      </Stack>
      <Stack gap={4} mt={6}>
        <Title order={6}>{"Share Your Club's Events"}</Title>
        <TextInput
          placeholder="Event calendar or next gathering, (e.g. Luma, Partiful, etc.)"
          {...register("eventCalendarUrl")}
          error={errors.eventCalendarUrl?.message}
        />
      </Stack>
    </Stack>
  );
}

function ShareLinkSection() {
  const {
    register,
    formState: { errors }
  } = useFormContext<UpdateClubInput>();

  return (
    <Stack gap={8}>
      <Title order={6}>Club Link</Title>
      <PrefixedInput
        prefix="clubs.buildirl.com/join/"
        placeholder="club-tag"
        required
        {...register("publicId")}
        error={errors.publicId?.message}
      />
    </Stack>
  );
}

function ThemeSection() {
  const { watch, setValue } = useFormContext<UpdateClubInput>();
  const theme = watch("theme");

  return (
    <Stack gap={12}>
      <Title order={6}>Background</Title>
      <ThemeSelector
        value={theme}
        onChange={(newTheme) => setValue("theme", newTheme)}
      />
    </Stack>
  );
}

function FontSection() {
  const { watch, setValue } = useFormContext<UpdateClubInput>();
  const font = watch("themeHeadingFont");

  return (
    <Stack gap={12}>
      <Title order={6}>Font</Title>
      <FontSelector
        value={font}
        onChange={(newFont) => setValue("themeHeadingFont", newFont)}
      />
    </Stack>
  );
}

interface ShowcaseImagesSectionProps {
  club: Club;
}

function ShowcaseImagesSection({ club }: ShowcaseImagesSectionProps) {
  return (
    <Stack gap={8}>
      <Title order={6}>Showcase Photos</Title>
      <ClubImageUploader club={club} />
    </Stack>
  );
}

interface UpdateClubFormProps {
  club: Club;
}

function UpdateClubForm({ club }: UpdateClubFormProps) {
  const clubImageSize = useMatches({ base: 240, md: 360 });
  const utils = api.useUtils();
  const router = useRouter();

  const updateClub = api.main.updateClub.useMutation({
    onSuccess: (_, v) => {
      utils.main.club.invalidate({ id: v.id });
      utils.main.clubByPublicId.invalidate({
        publicId: v.input.publicId
      });
      utils.main.userMemberships.invalidate();

      notifySuccess("Changes saved", "Your club has been updated successfully");

      router.push(`/club/${club.id}/manage`);
    },
    onError: handleDefaultMutationError
  });

  const onSubmit = (values: UpdateClubInput) => {
    updateClub.mutate({
      id: club.id,
      input: values
    });
  };

  const methods = useForm<UpdateClubInput>({
    defaultValues: {
      publicId: club.publicId,
      name: club.name,
      tagLine: club.tagLine,
      description: club.description,
      // TODO this casting can be removed once location field is made non-nullable
      // we cast here because the value can be null for older clubs the null value will fail at
      // validation time, forcing the user to back-populated their location to a non-null value
      location: club.location as City,
      websiteUrl: club.websiteUrl ?? "",
      instagramHandle: club.instagramHandle ?? "",
      eventCalendarUrl: club.eventCalendarUrl ?? "",
      theme: club.theme,
      themeHeadingFont: club.themeHeadingFont,
      faqs: club.faqs
    },
    resolver: (data, context, options) => {
      return zodResolver(UpdateClubInputSchema)(
        {
          ...data,
          websiteUrl: data.websiteUrl === "" ? null : data.websiteUrl,
          instagramHandle:
            data.instagramHandle === "" ? null : data.instagramHandle,
          eventCalendarUrl:
            data.eventCalendarUrl === "" ? null : data.eventCalendarUrl
        },
        context,
        options
      );
    },
    mode: "onBlur"
  });

  const {
    formState: { errors }
  } = methods;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={(e) => {
          return methods.handleSubmit(onSubmit)(e);
        }}
      >
        <Stack gap={22}>
          <EditableClubImage
            club={club}
            size={clubImageSize}
            style={{
              alignSelf: "center",
              position: "relative"
            }}
          />

          <BasicInfoSection />
          <LocationSection />

          <LinksSection />
          <ShareLinkSection />

          <ThemeSection />
          <FontSection />

          <ShowcaseImagesSection club={club} />

          <FAQsSection />

          <Box mt={32} style={{ display: "flex", justifyContent: "center" }}>
            <Button
              w={100}
              type="submit"
              disabled={Object.keys(errors).length > 0}
              loading={updateClub.isPending}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Save
            </Button>
          </Box>
        </Stack>
      </form>
    </FormProvider>
  );
}

export default function UpdateClub() {
  const params = useParams<{ clubId: string }>();
  const clubId = strictParseInt(params.clubId);

  const r = api.main.club.useQuery({ id: clubId });

  QueryError.check({
    result: r,
    fieldName: "club"
  });

  return (
    isLoaded(r) && (
      <WithLocalNavigationHeader>
        <Stack px={{ base: 20, sm: 150 }} mb={"md"}>
          <UpdateClubForm club={r.data!} />
        </Stack>
      </WithLocalNavigationHeader>
    )
  );
}
