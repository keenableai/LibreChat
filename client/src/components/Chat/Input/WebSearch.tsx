import React, { memo } from 'react';
import { Globe } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { CheckboxButton } from '@librechat/client';
import { Permissions, PermissionTypes, Constants, SearchProviders } from 'librechat-data-provider';
import { useLocalize, useHasAccess } from '~/hooks';
import { useBadgeRowContext } from '~/Providers';
import { useGetStartupConfig } from '~/data-provider';
import { ephemeralAgentByConvoId } from '~/store';

function WebSearch() {
  const localize = useLocalize();
  const canUseWebSearch = useHasAccess({
    permissionType: PermissionTypes.WEB_SEARCH,
    permission: Permissions.USE,
  });
  const context = useBadgeRowContext();
  const { data: startupConfig } = useGetStartupConfig();
  const convoKey = context?.conversationId ?? Constants.NEW_CONVO;
  const ephemeralAgent = useRecoilValue(ephemeralAgentByConvoId(convoKey));
  if (!canUseWebSearch) {
    return null;
  }
  if (!context) {
    return null;
  }
  const { webSearch: webSearchData, searchApiKeyForm } = context;
  const { toggleState: webSearch, debouncedChange, isPinned, authData } = webSearchData;
  const { badgeTriggerRef } = searchApiKeyForm;

  /** Show the active Keenable search profile in the button label so it's
   *  visible at a glance: "Search · google" / "Search · parallel". Only
   *  surfaced when web search is on and the provider is keenable. */
  const isKeenable = startupConfig?.webSearch?.searchProvider === SearchProviders.KEENABLE;
  const activeProfile = ephemeralAgent?.web_search_profile;
  const baseLabel = localize('com_ui_search');
  const label =
    webSearch && isKeenable && activeProfile ? `${baseLabel} · ${activeProfile}` : baseLabel;

  return (
    (isPinned || (webSearch && authData?.authenticated)) && (
      <CheckboxButton
        ref={badgeTriggerRef}
        className="max-w-fit"
        checked={webSearch}
        setValue={debouncedChange}
        label={label}
        isCheckedClassName="border-blue-600/40 bg-blue-500/10 hover:bg-blue-700/10"
        icon={<Globe className="icon-md" aria-hidden="true" />}
      />
    )
  );
}

export default memo(WebSearch);
