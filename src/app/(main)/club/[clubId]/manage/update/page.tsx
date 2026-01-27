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
  useMatches,
  Select,
  ActionIcon,
  Flex,
  Text,
  ColorInput,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { DateInput, TimePicker } from "@mantine/dates";
import EditableClubImage from "~/client/components/EditableClubImage";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import ThemeSelector from "~/app/(main)/club/[clubId]/manage/update/_components/ThemeSelector";
import ClubImageUploader from "~/app/(main)/club/[clubId]/manage/update/_components/ClubDisplayImageUpload";
import FontSelector from "~/app/(main)/club/[clubId]/manage/update/_components/FontSelector";
import FAQsSection from "~/app/(main)/club/[clubId]/manage/update/_components/FAQsSection";
import { IconClock, IconDeviceFloppy } from "@tabler/icons-react";
import {
  useForm,
  FormProvider,
  useFormContext,
  Controller
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PrefixedInput from "~/client/components/PrefixedInput";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";
import LocationSelect from "~/client/components/LocationSelect";
import { City } from "~/server/club/types/location";
import { ClubValueCreator } from "./_components/ClubValueCreator";
import { DEFAULT_ACCENT_COLOR } from "~/client/utils/color";

const INPUT_BORDER_RADIUS = 12;

const errorStyles = {
  input: {
    border: "2px solid red",
    color: "red",
    borderRadius: INPUT_BORDER_RADIUS
  }
};

const inputStyles = {
  input: {
    border: "2px solid black",
    borderRadius: INPUT_BORDER_RADIUS
  }
};

type SectionCardProps = {
  children: React.ReactNode;
  gap?: number;
};

function SectionCard({ children, gap = 16 }: SectionCardProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const border = isDark
    ? `2px solid ${theme.other.dark.borderStrong}`
    : "2px solid #000";
  const shadow = isDark
    ? `6px 6px 0px ${theme.other.dark.shadow}`
    : "6px 6px 0px #000";
  const backgroundColor = isDark ? theme.other.dark.surface : "#fff";

  return (
    <Stack
      gap={gap}
      style={{
        border,
        borderRadius: 15,
        boxShadow: shadow,
        padding: "24px",
        backgroundColor
      }}
    >
      {children}
    </Stack>
  );
}

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
        styles={errors.name ? errorStyles : inputStyles}
      />
      <TextInput
        placeholder="Tag line"
        {...register("tagLine")}
        error={errors.tagLine?.message}
        styles={errors.tagLine ? errorStyles : inputStyles}
      />
    </Stack>
  );
}

function WhoWeAreSection() {
  const {
    register,
    formState: { errors }
  } = useFormContext<UpdateClubInput>();

  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <Title order={2}>Who You Gather</Title>
        <Text c="gray" size={"sm"}>
          Introduce your club to the people you want in it. Tell them who you
          are and who you gather.
        </Text>
      </Stack>
      <Textarea
        placeholder="About your club"
        {...register("description")}
        rows={6}
        error={errors.description?.message}
        styles={errors.description ? errorStyles : inputStyles}
      />
    </Stack>
  );
}

function HowWeHangSection() {
  const {
    register,
    formState: { errors }
  } = useFormContext<UpdateClubInput>();

  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <Title order={2}>What You Do Together</Title>
        <Text size="sm" c="gray">
          Great clubs meet regularly. How does yours get together?
        </Text>
      </Stack>
      <RhythmSection />
      <Stack gap={4} mt={6}>
        <Title order={6}>
          {"Link to club’s event calendar or next event "}
        </Title>
        <TextInput
          placeholder="Event calendar or next gathering, (e.g. Luma, Partiful, etc.)"
          {...register("eventCalendarUrl")}
          error={errors.eventCalendarUrl?.message}
          styles={errors.eventCalendarUrl ? errorStyles : inputStyles}
        />
      </Stack>
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
        styles={errors.location ? errorStyles : inputStyles}
      />
    </Stack>
  );
}

function RhythmSection() {
  const {
    control,
    formState: { errors },
    trigger,
    setValue,
    watch
  } = useFormContext<UpdateClubInput>();

  const [timeDropdownOpened, setDropdownOpened] = useState(false);
  const rhythmError = errors.rhythm?.message;
  const rhythm = watch("rhythm");
  const hasAnyRhythmField = !!(
    rhythm?.startDate ||
    rhythm?.startTime ||
    rhythm?.frequency
  );

  return (
    <Stack gap={8}>
      <Title
        order={6}
      >{`Club’s Regular Meetup Schedule (If you have one)`}</Title>
      <Flex
        gap={8}
        direction={{ base: "column", sm: "row" }}
        wrap={{ base: "wrap", sm: "nowrap" }}
      >
        <Box flex={1} w="100%">
          <Controller
            name="rhythm.frequency"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Frequency"
                data={["Weekly", "Biweekly", "Monthly"]}
                {...field}
                w="100%"
                onChange={(val) => {
                  field.onChange(val);
                  trigger("rhythm");
                }}
                styles={rhythmError && !field.value ? errorStyles : inputStyles}
              />
            )}
          />
        </Box>
        <Box flex={1} w="100%">
          <Controller
            name="rhythm.startDate"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(val) => {
                  field.onChange(val);
                  trigger("rhythm");
                }}
                placeholder="Start Date"
                w="100%"
                styles={rhythmError && !field.value ? errorStyles : inputStyles}
              />
            )}
          />
        </Box>
        <Box flex={1} w="100%">
          <Controller
            name="rhythm.startTime"
            control={control}
            render={({ field }) => (
              <TimePicker
                withDropdown
                rightSection={
                  <ActionIcon
                    onClick={() => setDropdownOpened(true)}
                    variant="default"
                  >
                    <IconClock size={18} stroke={1.5} />
                  </ActionIcon>
                }
                format="12h"
                value={field.value ?? ""}
                onChange={(val) => {
                  field.onChange(val);
                  trigger("rhythm");
                }}
                popoverProps={{
                  opened: timeDropdownOpened,
                  onChange: (_opened) => !_opened && setDropdownOpened(false)
                }}
                minutesStep={15}
                styles={rhythmError && !field.value ? errorStyles : inputStyles}
              />
            )}
          />
        </Box>
      </Flex>
      {rhythmError && (
        <div style={{ minHeight: 20, color: "red", fontSize: 12 }}>
          {rhythmError}
        </div>
      )}
      {hasAnyRhythmField && (
        <Box display="flex" w="100%" style={{ justifyContent: "center" }}>
          <Button
            onClick={() => {
              setValue("rhythm", {
                startDate: null,
                startTime: null,
                frequency: null
              });
              trigger("rhythm");
            }}
            style={{ backgroundColor: "transparent", width: "fit-content" }}
          >
            <Text size="sm" c="black" td="underline">
              Clear all rhythm fields
            </Text>
          </Button>
        </Box>
      )}
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
        styles={errors.websiteUrl ? errorStyles : inputStyles}
      />
      <Stack gap={4}>
        <PrefixedInput
          prefix="instagram.com/"
          placeholder="username"
          {...register("instagramHandle")}
          error={errors.instagramHandle?.message}
          styles={errors.instagramHandle ? errorStyles : inputStyles}
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
        styles={errors.publicId ? errorStyles : inputStyles}
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

function AccentColorSection() {
  const {
    control,
    formState: { errors }
  } = useFormContext<UpdateClubInput>();

  return (
    <Stack gap={12}>
      <Title order={6}>Accent color</Title>
      <Controller
        name="accentColor"
        control={control}
        render={({ field }) => (
          <ColorInput
            placeholder={DEFAULT_ACCENT_COLOR}
            value={field.value ?? DEFAULT_ACCENT_COLOR}
            onChange={(value) => field.onChange(value || null)}
            error={errors.accentColor?.message}
            styles={errors.accentColor ? errorStyles : inputStyles}
          />
        )}
      />
      <Text size="xs" c="gray">
        Used for buttons and price labels on your join page.
      </Text>
    </Stack>
  );
}

function ClubValuesSection() {
  const { watch, setValue } = useFormContext<UpdateClubInput>();
  const values = watch("values");

  return (
    <Stack>
      <Stack gap={4}>
        <Title order={2}>Your Vibe</Title>
        <Text size="sm" c="gray">
          Share your club’s vibe and values - it helps bring the right people
          in.
        </Text>
      </Stack>
      <ClubValueCreator
        clubValues={values}
        onChange={(newValues) => setValue("values", newValues)}
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
      rhythm: club.rhythm ?? {
        startDate: null,
        startTime: null,
        frequency: null
      },
      // TODO this casting can be removed once location field is made non-nullable
      // we cast here because the value can be null for older clubs the null value will fail at
      // validation time, forcing the user to back-populated their location to a non-null value
      location: club.location as City,
      websiteUrl: club.websiteUrl ?? "",
      instagramHandle: club.instagramHandle ?? "",
      eventCalendarUrl: club.eventCalendarUrl ?? "",
      theme: club.theme,
      themeHeadingFont: club.themeHeadingFont,
      accentColor: club.accentColor,
      contributionReasons: club.contributionReasons,
      values: club.values,
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
        <Stack gap={42} px={{ sm: "116g" }}>
          <EditableClubImage
            club={club}
            size={clubImageSize}
            style={{
              alignSelf: "center",
              position: "relative"
            }}
          />
          <SectionCard gap={16}>
            <Title order={2}>Club Basics</Title>
            <BasicInfoSection />
            <ShareLinkSection />
            <LocationSection />
            <LinksSection />
          </SectionCard>

          <SectionCard>
            <WhoWeAreSection />
          </SectionCard>

          <SectionCard>
            <HowWeHangSection />
          </SectionCard>

          <SectionCard>
            <ClubValuesSection />
          </SectionCard>

          <SectionCard gap={16}>
            <Stack gap={4}>
              <Title order={2}>Show off your club! </Title>
              <Text size="sm" c="gray">
                Add a background, font, photos and FAQs to make your club page
                pop.
              </Text>
            </Stack>
            <ThemeSection />
            <FontSection />
            <AccentColorSection />
            <ShowcaseImagesSection club={club} />
            <FAQsSection />
          </SectionCard>

          <Box
            mb={32}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {Object.keys(errors).length > 0 && (
              <p style={{ fontSize: "12px", color: "red" }}>
                Please review required fields above.
              </p>
            )}
            <Button
              w={250}
              type="submit"
              c="white"
              bg="green"
              disabled={Object.keys(errors).length > 0}
              loading={updateClub.isPending}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Save Club
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

  const club = api.main.club.useQuery({ id: clubId });

  QueryError.check({
    result: club,
    fieldName: "club"
  });

  return (
    isLoaded(club) && (
      <WithLocalNavigationHeader>
        <Stack px={{ base: 24, sm: 160 }} mb={"md"}>
          <UpdateClubForm club={club.data!} />
        </Stack>
      </WithLocalNavigationHeader>
    )
  );
}
